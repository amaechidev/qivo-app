"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download } from "lucide-react";
import { generateQRCode } from "@/lib/grcode";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
  pollTitle: string;
}

export default function QRModal({ isOpen, onClose, pollId }: QRModalProps) {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const pollUrl = `${window.location.origin}/polls/${pollId}`;

  useEffect(() => {
    if (isOpen) {
      generateQRCode(pollUrl).then(setQrCodeUrl);
    }
  }, [isOpen, pollUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      toast({
        title: "Link Copied!",
        description: "Poll link copied to clipboard",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `poll-qr-${pollId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded!",
      description: "QR code saved to your device",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share Your Poll</DialogTitle>
          <p className="text-center text-muted-foreground">
            Scan the QR code or copy the link
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="w-52 h-52 bg-muted rounded-xl flex items-center justify-center bg-white p-4">
            {/* {qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                className="w-40 h-40 rounded-lg"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )} */}
            <QRCode size={256} value={pollUrl} />
          </div>

          {/* URL Input */}
          <div className="w-full">
            <div className="flex items-center space-x-2 bg-background border border-border rounded-lg p-3">
              <Input
                type="text"
                value={pollUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-foreground outline-none border-0 p-0"
                data-testid="input-poll-url"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLink}
                className="text-primary hover:text-primary/80 transition-colors p-1"
                data-testid="button-copy-url"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 w-full">
            <Button
              onClick={copyLink}
              className="flex-1 spring-animation touch-target"
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="secondary"
              onClick={downloadQR}
              className="flex-1 spring-animation touch-target"
              disabled={!qrCodeUrl}
              data-testid="button-download-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              Save QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
