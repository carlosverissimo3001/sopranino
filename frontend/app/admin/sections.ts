import { Snowflake, Users, type LucideIcon } from 'lucide-react';

/** Adding a section is a folder under `app/admin` and an entry here. */
export const ADMIN_SECTIONS: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matches the heading colour each tool already uses. */
  tone: string;
}[] = [
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    tone: 'text-blue-400',
  },
  {
    href: '/admin/streak-questions',
    label: 'Streak quiz',
    icon: Snowflake,
    tone: 'text-cyan-400',
  },
];
