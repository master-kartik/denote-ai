"use client";
import { useEffect, useState } from "react";
import "@/app/globals.css";
import { Auth } from "@/features/auth/auth-form";
import NoteManager from "@/features/notes/note-manager";
import { supabase } from "@/lib/supabase-client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { Session } from "@supabase/supabase-js";

function App() {

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const currentSession = await supabase.auth.getSession();
      console.log(currentSession);
      setSession(currentSession.data.session);
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, sessionArg: Session | null) => {
        setSession(sessionArg);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center justify-center">
          <svg
            className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500"
            viewBox="0 0 100 101"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid"
          >
            <path
              d="M50.2,15.1c-19.4,0-35.1,15.7-35.1,35.1c0,19.4,15.7,35.1,35.1,35.1c19.4,0,35.1-15.7,35.1-35.1C85.3,30.8,69.6,15.1,50.2,15.1z"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
            ></path>
          </svg>
        </div>
        <div className="w-8 h-8 border-4 border-neutral-900-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {session ? (
        <SidebarProvider>
          <AppSidebar />
          <>
            {session && <NoteManager session={session} />}
          </>
        </SidebarProvider>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;