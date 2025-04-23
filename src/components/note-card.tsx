import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { Note } from "./note-manager";

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => (
  <Card
    className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    onClick={() => onClick(note)}
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
);

export default NoteCard;
