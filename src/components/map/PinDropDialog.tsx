import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  lngLat: [number, number] | null;
  onSubmit: (data: { label: string; url?: string; notes?: string }) => void;
  onClose: () => void;
};

export function PinDropDialog({ open, lngLat, onSubmit, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!label.trim()) return;
    onSubmit({ label: label.trim(), url: url.trim() || undefined, notes: notes.trim() || undefined });
    setLabel(""); setUrl(""); setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save property pin</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Label *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2-bed flat, Hackney" autoFocus />
          </div>
          <div>
            <Label className="text-xs">Listing URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Viewing on Sat, asking £550k..." rows={3} />
          </div>
          {lngLat && (
            <p className="text-[11px] text-muted-foreground font-mono">
              {lngLat[1].toFixed(5)}, {lngLat[0].toFixed(5)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>Save pin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
