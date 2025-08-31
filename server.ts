// storage
import {
  type User,
  type InsertUser,
  type Poll,
  type InsertPoll,
  type Vote,
  type InsertVote,
  type PollWithStats,
  users,
  polls,
  votes,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
let db: any = null;
let isDbAvailable = false;

if (connectionString && connectionString.startsWith("postgres")) {
  try {
    const sql_client = neon(connectionString);
    db = drizzle(sql_client);
    isDbAvailable = true;
  } catch (error) {
    console.warn("Database connection failed, falling back to memory storage");
    isDbAvailable = false;
  }
} else {
  console.log(
    "No valid DATABASE_URL provided, using memory storage for development"
  );
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Poll operations
  getPoll(id: string): Promise<Poll | undefined>;
  getPollWithStats(id: string): Promise<PollWithStats | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  getUserPolls(userId: string): Promise<PollWithStats[]>;
  updatePoll(id: string, updates: Partial<Poll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<boolean>;

  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getPollVotes(pollId: string): Promise<Vote[]>;
  hasUserVoted(
    pollId: string,
    voterIp: string,
    voterId?: string
  ): Promise<boolean>;
}

class DbStorage implements IStorage {
  constructor() {}

  async ensureTables() {
    // Tables are automatically created via Drizzle migrations
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const result = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id))
      .limit(1);
    return result[0];
  }

  async getPollWithStats(id: string): Promise<PollWithStats | undefined> {
    const poll = await this.getPoll(id);
    if (!poll) return undefined;

    const creator = await this.getUser(poll.creatorId);
    if (!creator) return undefined;

    const pollVotes = await db.select().from(votes).where(eq(votes.pollId, id));
    const voteCount = pollVotes.length;

    // Count votes per option
    const voteCounts = new Map<number, number>();
    pollVotes.forEach((vote) => {
      const current = voteCounts.get(vote.optionIndex) || 0;
      voteCounts.set(vote.optionIndex, current + 1);
    });

    const voteStats = Array.from(voteCounts.entries()).map(
      ([optionIndex, count]) => ({
        optionIndex,
        count,
      })
    );

    return {
      ...poll,
      voteCount,
      votes: voteStats,
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
      },
    };
  }

  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const result = await db.insert(polls).values(insertPoll).returning();
    return result[0];
  }

  async getUserPolls(userId: string): Promise<PollWithStats[]> {
    const userPolls = await db
      .select()
      .from(polls)
      .where(eq(polls.creatorId, userId))
      .orderBy(desc(polls.createdAt));
    const pollsWithStats = await Promise.all(
      userPolls.map(async (poll) => await this.getPollWithStats(poll.id))
    );
    return pollsWithStats.filter(Boolean) as PollWithStats[];
  }

  async updatePoll(
    id: string,
    updates: Partial<Poll>
  ): Promise<Poll | undefined> {
    const result = await db
      .update(polls)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(polls.id, id))
      .returning();
    return result[0];
  }

  async deletePoll(id: string): Promise<boolean> {
    // Delete associated votes first
    await db.delete(votes).where(eq(votes.pollId, id));

    const result = await db.delete(polls).where(eq(polls.id, id)).returning();
    return result.length > 0;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const result = await db.insert(votes).values(insertVote).returning();
    return result[0];
  }

  async getPollVotes(pollId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.pollId, pollId));
  }

  async hasUserVoted(
    pollId: string,
    voterIp: string,
    voterId?: string
  ): Promise<boolean> {
    let query = db.select().from(votes).where(eq(votes.pollId, pollId));

    if (voterId) {
      query = query.where(
        sql`(${votes.voterIp} = ${voterIp} OR ${votes.voterId} = ${voterId})`
      );
    } else {
      query = query.where(eq(votes.voterIp, voterIp));
    }

    const result = await query.limit(1);
    return result.length > 0;
  }
}

// Memory Storage for development fallback
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private polls: Map<string, Poll> = new Map();
  private votes: Map<string, Vote> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async getPollWithStats(id: string): Promise<PollWithStats | undefined> {
    const poll = this.polls.get(id);
    if (!poll) return undefined;

    const creator = this.users.get(poll.creatorId);
    if (!creator) return undefined;

    const pollVotes = Array.from(this.votes.values()).filter(
      (vote) => vote.pollId === id
    );
    const voteCount = pollVotes.length;

    const voteCounts = new Map<number, number>();
    pollVotes.forEach((vote) => {
      const current = voteCounts.get(vote.optionIndex) || 0;
      voteCounts.set(vote.optionIndex, current + 1);
    });

    const voteStats = Array.from(voteCounts.entries()).map(
      ([optionIndex, count]) => ({
        optionIndex,
        count,
      })
    );

    return {
      ...poll,
      voteCount,
      votes: voteStats,
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
      },
    };
  }

  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const id = crypto.randomUUID();
    const poll: Poll = {
      ...insertPoll,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.polls.set(id, poll);
    return poll;
  }

  async getUserPolls(userId: string): Promise<PollWithStats[]> {
    const userPolls = Array.from(this.polls.values())
      .filter((poll) => poll.creatorId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    const pollsWithStats = await Promise.all(
      userPolls.map(async (poll) => await this.getPollWithStats(poll.id))
    );
    return pollsWithStats.filter(Boolean) as PollWithStats[];
  }

  async updatePoll(
    id: string,
    updates: Partial<Poll>
  ): Promise<Poll | undefined> {
    const poll = this.polls.get(id);
    if (!poll) return undefined;

    const updatedPoll = { ...poll, ...updates, updatedAt: new Date() };
    this.polls.set(id, updatedPoll);
    return updatedPoll;
  }

  async deletePoll(id: string): Promise<boolean> {
    const pollVotes = Array.from(this.votes.entries()).filter(
      ([_, vote]) => vote.pollId === id
    );
    pollVotes.forEach(([voteId]) => this.votes.delete(voteId));
    return this.polls.delete(id);
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = crypto.randomUUID();
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date(),
    };
    this.votes.set(id, vote);
    return vote;
  }

  async getPollVotes(pollId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.pollId === pollId
    );
  }

  async hasUserVoted(
    pollId: string,
    voterIp: string,
    voterId?: string
  ): Promise<boolean> {
    return Array.from(this.votes.values()).some(
      (vote) =>
        vote.pollId === pollId &&
        (vote.voterIp === voterIp || (voterId && vote.voterId === voterId))
    );
  }
}

// Use the appropriate storage based on database availability
export const storage = isDbAvailable ? new DbStorage() : new MemStorage();

// routes
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertPollSchema,
  insertVoteSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(
        data.password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  });

  // Poll routes
  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPollWithStats(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.post("/api/polls", authenticateToken, async (req, res) => {
    try {
      const data = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll({
        ...data,
        creatorId: (req as any).user.id,
      });
      res.json(poll);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to create poll",
      });
    }
  });

  app.get("/api/users/:userId/polls", authenticateToken, async (req, res) => {
    try {
      if ((req as any).user.id !== req.params.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const polls = await storage.getUserPolls(req.params.userId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.put("/api/polls/:id", authenticateToken, async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      if (poll.creatorId !== (req as any).user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);

      const updatedPoll = await storage.updatePoll(req.params.id, updates);
      res.json(updatedPoll);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to update poll",
      });
    }
  });

  app.delete("/api/polls/:id", authenticateToken, async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      if (poll.creatorId !== (req as any).user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePoll(req.params.id);
      res.json({ message: "Poll deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete poll" });
    }
  });

  // Vote routes
  app.post("/api/polls/:id/vote", async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse({
        ...req.body,
        pollId: req.params.id,
        voterIp: req.ip,
      });

      // Check if poll exists and is active
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      if (!poll.isActive) {
        return res.status(400).json({ message: "Poll is no longer active" });
      }

      // Check if user has already voted
      const hasVoted = await storage.hasUserVoted(
        req.params.id,
        req.ip,
        voteData.voterId
      );
      if (hasVoted) {
        return res
          .status(400)
          .json({ message: "You have already voted on this poll" });
      }

      // Validate option index
      if (
        voteData.optionIndex < 0 ||
        voteData.optionIndex >= poll.options.length
      ) {
        return res.status(400).json({ message: "Invalid option selected" });
      }

      const vote = await storage.createVote(voteData);

      // Return updated poll stats
      const updatedPoll = await storage.getPollWithStats(req.params.id);
      res.json(updatedPoll);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to cast vote",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
