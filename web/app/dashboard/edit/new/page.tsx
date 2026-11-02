import type { Metadata } from "next";
import { isDemo } from "@/lib/demo";
import { NewProject } from "./new-project";

export const metadata: Metadata = { title: "New project" };

/** New project: the editor, empty, waiting for a clip (new-project.tsx). */
export default function NewProjectPage() {
  return <NewProject demo={isDemo} />;
}
