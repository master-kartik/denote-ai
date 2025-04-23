import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LogOut } from "lucide-react";
import { summarizeNote } from '@/app/actions/summarize';
import NotesGrid from "@/components/notes-grid";
import NoteDialog from "./note-dialog";

export interface Note {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

const handleSignOut = async () => {
  await supabase.auth.signOut();
};

function NoteManager({ session }: { session: Session }) {
  const [newNote, setNewNote] = useState({ title: "", description: "" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editNote, setEditNote] = useState<{ title: string; description: string }>({ title: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fetchNotes = async () => {
    const { error, data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error reading notes:", error.message);
      return;
    }
    setNotes(data);
  };

  const deleteNote = async (id: number) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting note:", error.message);
      return;
    }
    await fetchNotes();
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsDialogOpen(false);
    }
  };

  const updateNote = async () => {
    if (!selectedNote) return;
    const { error } = await supabase
      .from("notes")
      .update({
        title: editNote.title,
        description: editNote.description,
      })
      .eq("id", selectedNote.id);

    if (error) {
      console.error("Error updating note:", error.message);
      return;
    }
    await fetchNotes();
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title && !newNote.description) return;
    const { error } = await supabase
      .from("notes")
      .insert({ ...newNote, email: session.user.email })
      .select()
      .single();
    if (error) {
      console.error("Error adding note:", error.message);
      return;
    }
    setNewNote({ title: "", description: "" });
    await fetchNotes();
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setEditNote({ title: note.title, description: note.description });
    setIsDialogOpen(true);
  };

  const handleAiSummary = async (description: string) => {
    if (!selectedNote) return;
    setIsSummarizing(true);
    try {
      const text = await summarizeNote(description);
      setEditNote(prev => ({
        ...prev,
        description: `[AI Summary] ${text} \n\n${prev.description}`,
      }));
    } catch (err) {
      console.error('Summary failed:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("notes-channel");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        () => fetchNotes()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        () => fetchNotes()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        () => fetchNotes()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="justify-between flex items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">Notes</h1>
        <Button className="lg:hidden" variant={"secondary"} onClick={handleSignOut}>
          <LogOut />
          <span>{"Sign Out"}</span>
        </Button>
      </div>
      {/* Search and Add Note Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search notes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setSelectedNote(null);
            setEditNote({ title: "", description: "" });
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Note
        </Button>
      </div>
      {/* Notes Grid */}
      <NotesGrid notes={filteredNotes} onNoteClick={handleNoteClick} searchTerm={searchTerm} />
      {/* Note Dialog */}
      <NoteDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedNote(null);
          setIsDialogOpen(open);
        }}
        selectedNote={selectedNote}
        editNote={editNote}
        setEditNote={setEditNote}
        newNote={newNote}
        setNewNote={setNewNote}
        onSubmit={handleSubmit}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onAiSummary={handleAiSummary}
        isSummarizing={isSummarizing}
      />
    </div>
  );
}

export default NoteManager;