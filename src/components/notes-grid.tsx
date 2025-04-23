import NoteCard from "./note-card";
import { Note } from "./note-manager";

interface NotesGridProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  searchTerm: string;
}

const NotesGrid: React.FC<NotesGridProps> = ({ notes, onNoteClick, searchTerm }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {notes.length > 0 ? (
      notes.map((note) => (
        <NoteCard key={note.id} note={note} onClick={onNoteClick} />
      ))
    ) : (
      <div className="col-span-full text-center py-12 text-gray-500">
        {searchTerm ? "No matching notes found" : "No notes yet. Create your first note!"}
      </div>
    )}
  </div>
);

export default NotesGrid;
