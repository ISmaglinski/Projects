import type { Metadata } from "next";
import { HomeTabs } from "./home-tabs";

export const metadata: Metadata = {
  title: "The Smaglinskis | Three Brothers Who Build",
  description:
    "The shared portfolio of Ian, Jacob, and Isaac Smaglinski, spanning data, AI, custom hardware, and infrastructure.",
};

export default function Home() {
  return <HomeTabs />;
}
