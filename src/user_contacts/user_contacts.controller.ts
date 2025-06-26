import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { UserContact } from "../types/contacts";
import { UserContacts } from "./user_contacts.model";

export async function insertContacts(request: Request, response: Response): Promise<void> {
  const { contactDetails, ownerPhoneNumber } = request.body as {
    contactDetails: UserContact[];
    ownerPhoneNumber: string;
  };

  if (!ownerPhoneNumber || !contactDetails) {
    response.status(400).send('Missing required fields');
    return;
  }

  try {
    for (const contact of contactDetails) {
      const existingContact = await UserContacts.findOne({
        where: {
          ownerPhoneNumber,
          contactPhoneNumber: contact.phoneNumber,
        },
      });

      if (existingContact) {
        if (existingContact.savedAs !== contact.savedAs) {
          await existingContact.update({
            savedAs: contact.savedAs || null,
            updatedAt: new Date(),
          });
        }
      } else {
        await UserContacts.create({
          id: uuidv4(),
          ownerPhoneNumber,
          contactPhoneNumber: contact.phoneNumber,
          savedAs: contact.savedAs || null,
          updatedAt: new Date(),
        });
      }
    }

    response.status(200).send('Success');
  } catch (error) {
      console.error('Error in insertContacts:', error);
    response.status(500).send(`${(error as Error).message}`);
  }
}
export async function getSavedName(ownerPhoneNumber: string, contactPhoneNumber: string) {
  try {
    const contact = await UserContacts.findOne({
      where: {
        ownerPhoneNumber: ownerPhoneNumber,
        contactPhoneNumber: contactPhoneNumber,
      },
    });
    if (contact) {
      return contact.savedAs;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching saved name: ${(error as Error).message}`);
    return null;
  }
}