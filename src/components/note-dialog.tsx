import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand, Trash2, Save } from "lucide-react";
import { Note } from "./note-manager";

interface NoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNote: Note | null;
  editNote: { title: string; description: string };
  setEditNote: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
  newNote: { title: string; description: string };
  setNewNote: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onAiSummary: (description: string) => void;
  isSummarizing: boolean;
}

const NoteDialog: React.FC<NoteDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedNote,
  editNote,
  setEditNote,
  newNote,
  setNewNote,
  onSubmit,
  onUpdate,
  onDelete,
  onAiSummary,
  isSummarizing,
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {selectedNote ? "Edit Note" : "Create New Note"}
        </DialogTitle>
      </DialogHeader>
      <form
        onSubmit={selectedNote ? (e) => { e.preventDefault(); onUpdate(); } : onSubmit}
        className="space-y-4 my-4"
      >
        <Input
          placeholder="Note Title"
          value={selectedNote ? editNote.title : newNote.title}
          onChange={(e) =>
            selectedNote
              ? setEditNote(prev => ({ ...prev, title: e.target.value }))
              : setNewNote(prev => ({ ...prev, title: e.target.value }))
          }
          className="text-lg font-medium"
        />
        <Textarea
          placeholder="Note Description"
          value={selectedNote ? editNote.description : newNote.description}
          onChange={(e) =>
            selectedNote
              ? setEditNote(prev => ({ ...prev, description: e.target.value }))
              : setNewNote(prev => ({ ...prev, description: e.target.value }))
          }
          className="min-h-[200px]"
        />
        <DialogFooter className="flex flex-wrap sm:flex-nowrap gap-2">
          {selectedNote ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => selectedNote && onAiSummary(selectedNote.description)}
                disabled={isSummarizing}
                className="flex items-center gap-2"
              >
                <Wand className="h-4 w-4" />
                {isSummarizing ? "Summarizing..." : "AI Summary"}
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => selectedNote && onDelete(selectedNote.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="submit"
              disabled={!newNote.title && !newNote.description}
              className="ml-auto"
            >
              Create Note
            </Button>
          )}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default NoteDialog;
