import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LogOut } from "lucide-react";
import { summarizeNote } from "@/app/actions/summarize";
import NotesGrid from "./notes-grid";
import NoteDialog from "./note-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

async function fetchNotes(email?: string) {
  if (!email) return [];
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Note[];
}

async function addNote(note: Partial<Note>) {
  const { data, error } = await supabase.from("notes").insert([note]).select().single();
  if (error) throw error;
  return data as Note;
}

async function updateNote(id: string, updates: Partial<Note>) {
  const { data, error } = await supabase.from("notes").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Note;
}

async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
  return id;
}

const handleSignOut = async () => {
  await supabase.auth.signOut();
};

function NoteManager({ session }: { session: Session }) {
  const [newNote, setNewNote] = useState({ title: "", description: "" });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editNote, setEditNote] = useState<{ title: string; description: string }>({ title: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const queryClient = useQueryClient();
  const userEmail = session.user.email;

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["notes", userEmail],
    queryFn: () => fetchNotes(userEmail),
    enabled: !!userEmail,
  });

  const addNoteMutation = useMutation({
    mutationFn: addNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", userEmail] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) => updateNote(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", userEmail] }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", userEmail] }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title && !newNote.description) return;
    addNoteMutation.mutate({ ...newNote, email: userEmail } as Partial<Note> & { email: string });
    setNewNote({ title: "", description: "" });
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

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="justify-between flex items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">Notes</h1>
        <Button className="lg:hidden" variant={"secondary"} onClick={handleSignOut}>
          <LogOut />
          <span>{"Sign Out"}</span>
        </Button>
      </div>
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
      {error && (
        <div className="text-red-500 text-center mb-4" role="alert">
          Failed to load notes. Please try again later.
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="animate-spin w-6 h-6 border-4 border-t-transparent border-gray-400 rounded-full" aria-label="Loading notes" />
        </div>
      ) : (
        <NotesGrid notes={filteredNotes} onNoteClick={handleNoteClick} searchTerm={searchTerm} />
      )}
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
        onUpdate={() => {
          if (selectedNote) {
            updateNoteMutation.mutate({ id: selectedNote.id, updates: editNote });
            setIsDialogOpen(false);
          }
        }}
        onDelete={() => {
          if (selectedNote) {
            deleteNoteMutation.mutate(selectedNote.id);
            setIsDialogOpen(false);
          }
        }}
        onAiSummary={(desc) => handleAiSummary(desc)}
        isSummarizing={isSummarizing}
      />
    </div>
  );
}

export default NoteManager;