// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically generating Bingo cards for team members using AI.
 *
 * The flow `generateBingoCard` takes a list of team resolutions, member-provided resolutions, and the number of empty resolutions needed.
 * It returns a Bingo card filled with these resolutions.
 *
 * @exports generateBingoCard - The function to generate a Bingo card.
 * @exports BingoCardInput - The input type for the generateBingoCard function.
 * @exports BingoCardOutput - The return type for the generateBingoCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const BingoCardInputSchema = z.object({
  teamResolution: z.string().describe('The team resolution for the Bingo card.'),
  memberResolutions: z.array(z.string()).describe('An array of resolutions provided by the team member.'),
  otherMemberResolutions: z.array(z.string()).describe('An array of resolutions provided by other team members for this specific team member.'),
  emptySlotsNeeded: z.number().describe('The number of empty slots needed to fill the Bingo card.'),
});

export type BingoCardInput = z.infer<typeof BingoCardInputSchema>;

const BingoCardOutputSchema = z.object({
  card: z.array(z.string()).describe('An array representing the Bingo card, filled with resolutions and empty slots.'),
});

export type BingoCardOutput = z.infer<typeof BingoCardOutputSchema>;


export async function generateBingoCard(input: BingoCardInput): Promise<BingoCardOutput> {
  return generateBingoCardFlow(input);
}

const bingoCardPrompt = ai.definePrompt({
  name: 'bingoCardPrompt',
  input: {schema: BingoCardInputSchema},
  output: {schema: BingoCardOutputSchema},
  prompt: `You are an AI assistant specialized in generating Bingo cards for New Year's resolution teams.

    Given the following information, create a Bingo card:

    Team Resolution: {{{teamResolution}}}
    Member Resolutions: {{#each memberResolutions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    Other Member Resolutions: {{#each otherMemberResolutions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    Empty Slots Needed: {{{emptySlotsNeeded}}}

    The Bingo card should be an array of strings.  The team resolution should appear once in the card.
    The other member resolutions should also appear on the card.
    The member resolutions should be used to fill the rest of the card, and if there are not enough, fill the rest with "Empty".
    The bingo card should have a length of 25 (5x5).
    Ensure there are no duplicate resolutions on the card except for the empty resolutions.
    Shuffle the card before returning it.

    Output the bingo card array:
    `,
});

const generateBingoCardFlow = ai.defineFlow(
  {
    name: 'generateBingoCardFlow',
    inputSchema: BingoCardInputSchema,
    outputSchema: BingoCardOutputSchema,
  },
  async input => {
    const {teamResolution, memberResolutions, otherMemberResolutions, emptySlotsNeeded} = input;

    let card: string[] = [];

    // Add team resolution
    card.push(teamResolution);

    // Add resolutions from other members
    card = card.concat(otherMemberResolutions);

    // Add member resolutions, making sure not to exceed the card size.
    const remainingSlots = 25 - card.length;
    const availableMemberResolutions = [...memberResolutions]; // Create a copy to avoid modifying the original array
    while (card.length < 25 && availableMemberResolutions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableMemberResolutions.length);
      const resolution = availableMemberResolutions.splice(randomIndex, 1)[0]; // Remove the selected resolution
      card.push(resolution);
    }

    // Fill remaining slots with "Empty" if needed
    while (card.length < 25) {
      card.push("Empty");
    }

    // Shuffle the card
    for (let i = card.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [card[i], card[j]] = [card[j], card[i]];
    }

    return {
      card: card,
    };
  }
);
