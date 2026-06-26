import type { Contact } from "./schemas";

export const PLACEHOLDER_CONTACT: Required<Contact> = {
  city: "New York, NY 10001",
  email: "abcd@gmail.com",
  phone: "+1 (xxx) xxx-xxxx",
  linkedin: "linkedin.com/in/abcd",
};

export function resolveContact(contact?: Contact): Required<Contact> {
  return {
    city: contact?.city?.trim() || PLACEHOLDER_CONTACT.city,
    email: contact?.email?.trim() || PLACEHOLDER_CONTACT.email,
    phone: contact?.phone?.trim() || PLACEHOLDER_CONTACT.phone,
    linkedin: contact?.linkedin?.trim() || PLACEHOLDER_CONTACT.linkedin,
  };
}

export function formatContactLine(contact: Required<Contact>): string {
  return `${contact.city}  ·  ${contact.email}  ·  ${contact.phone}  ·  ${contact.linkedin}`;
}
