import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Trash2, Edit, Save, X, Wand } from "lucide-react";
import { format } from "date-fns";
import {LogOut} from "lucide-react"
import { summarizeNote } from '@/app/actions/summarize';



interface Note {
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
        description: editNote.description 
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
      .insert({ ...newNote, email: session.user.email})
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
        (payload) => {
          fetchNotes();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          fetchNotes();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        (payload) => {
          fetchNotes();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="justify-between flex items-center mb-6">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      <Button className="lg:hidden"  variant={"secondary"} onClick={handleSignOut}><LogOut />
      <span>{"Sign Out"}</span></Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card 
              key={note.id} 
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              onClick={() => handleNoteClick(note)}
            >
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{note.title}</h3>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <p className="text-gray-600 line-clamp-4">{note.description}</p>
              </CardContent>
              <CardFooter className="text-xs text-gray-400 pt-0">
                {format(new Date(note.created_at), "MMM d, yyyy")}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm ? "No matching notes found" : "No notes yet. Create your first note!"}
          </div>
        )}
      </div>

      {/* Note Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedNote(null);
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedNote ? "Edit Note" : "Create New Note"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
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
            

          </div>
          
          <DialogFooter className="flex flex-wrap sm:flex-nowrap gap-2">
            {selectedNote ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => selectedNote && handleAiSummary(selectedNote.description)}
                  disabled={isSummarizing}
                  className="flex items-center gap-2"
                >
                  <Wand className="h-4 w-4" />
                  {isSummarizing ? "Summarizing..." : "AI Summary"}
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="destructive"
                    onClick={() => selectedNote && deleteNote(selectedNote.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Button onClick={updateNote} className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!newNote.title && !newNote.description}
                className="ml-auto"
              >
                Create Note
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NoteManager;