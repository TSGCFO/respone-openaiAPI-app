"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import FileUpload from "@/components/file-upload";
import { Input } from "./ui/input";
import { CircleX } from "lucide-react";
// TODO: Replace with Framework7 Tooltip component
// import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
// import { Tooltip } from "./ui/tooltip";
// import { TooltipProvider } from "./ui/tooltip";

export default function FileSearchSetup() {
  const { vectorStore, setVectorStore } = useToolsStore();
  const [newStoreId, setNewStoreId] = useState<string>("");

  const unlinkStore = async () => {
    setVectorStore({
      id: "",
      name: "",
    });
  };

  const handleAddStore = async (storeId: string) => {
    if (storeId.trim()) {
      const newStore = await fetch(
        `/api/vector_stores/retrieve_store?vector_store_id=${storeId}`
      ).then((res) => res.json());
      if (newStore.id) {
        console.log("Retrieved store:", newStore);
        setVectorStore(newStore);
      } else {
        alert("Vector store not found");
      }
    }
  };

  return (
    <div>
      <div className="text-sm text-zinc-500">
        Upload a file to create a new vector store, or use an existing one.
      </div>
      <div className="flex items-center gap-2 mt-2 h-10">
        <div className="flex items-center gap-2 w-full">
          <div className="text-sm font-medium w-24 text-nowrap">
            Vector store
          </div>
          {vectorStore?.id ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-zinc-400  text-xs font-mono flex-1 text-ellipsis truncate">
                  {vectorStore.id}
                </div>
                {/* TODO: Replace with Framework7 Tooltip component */}
                <div className="relative group">
                  <CircleX
                    onClick={() => unlinkStore()}
                    size={16}
                    className="cursor-pointer text-zinc-400 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 transition-all"
                  />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-sm rounded p-2 whitespace-nowrap">
                    Unlink vector store
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="ID (vs_XXXX...)"
                value={newStoreId}
                onChange={(e) => setNewStoreId(e.target.value)}
                className="border border-zinc-300 rounded text-sm bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStore(newStoreId);
                  }
                }}
              />
              <div
                className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
                onClick={() => handleAddStore(newStoreId)}
              >
                Add
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex mt-4">
        <FileUpload
          accept=".txt,.md,.pdf,.doc,.docx"
          onUpload={async (files) => {
            // This would normally upload files to create a vector store
            console.log("Files to upload:", files);
            // For now, just show a message
            alert("File upload functionality not yet implemented");
            return null;
          }}
        />
      </div>
    </div>
  );
}
