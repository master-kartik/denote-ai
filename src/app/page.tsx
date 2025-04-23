"use client";
import { useEffect, useState } from "react";
import "@/app/globals.css";
import { Auth } from "@/components/auth";
import NoteManager from "@/components/note-manager";
import { supabase } from "@/supabase-client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"


function App() {
  const [session, setSession] = useState<any>(null);
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
      (_event, session) => {
        setSession(session);
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
            <NoteManager session={session} />
          </>
        </SidebarProvider>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;