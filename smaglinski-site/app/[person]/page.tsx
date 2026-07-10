import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileTabs } from "../profile-tabs";
import { people, personOrder, type PersonKey } from "../site-data";

export function generateStaticParams() {
  return personOrder.map((person) => ({ person }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person: key } = await params;
  const person = people[key as PersonKey];

  if (!person) {
    return {};
  }

  return {
    title: `${person.firstName} Smaglinski | ${person.title}`,
    description: person.intro,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person: key } = await params;
  const person = people[key as PersonKey];

  if (!person) {
    notFound();
  }

  return <ProfileTabs person={person} />;
}
