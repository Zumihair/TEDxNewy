/**
 * Imported historical event feedback.
 *
 * Feedback for events run before the site's own tokenised feedback flow
 * existed, collected via a previous survey provider and imported here for
 * reference. Kept as a committed data module (not in Supabase) because it is a
 * static archive with per-event question sets that differ from the native
 * feedback schema. Keyed by cms_events.slug; surfaced read-only on the admin
 * feedback page. GENERATED from the source CSVs; edit the CSV + re-run the
 * parser rather than hand-editing rows. The tedScore slot is filled in by hand
 * when TED provides the score.
 */

export type ImportedQuestionType =
  | "rating"
  | "choice"
  | "multiselect"
  | "boolean"
  | "text";

export type ImportedQuestion = {
  key: string;
  label: string;
  type: ImportedQuestionType;
  /** Rating scale ceiling (rating questions only). */
  max?: number;
};

export type ImportedAnswer =
  | number
  | string
  | string[]
  | boolean
  | null;

export type ImportedResponse = {
  submittedAt: string | null;
  name: string | null;
  answers: Record<string, ImportedAnswer>;
};

export type ImportedFeedbackDataset = {
  /** cms_events.slug this archive belongs to. */
  eventSlug: string;
  title: string;
  /** Where the data came from, shown as provenance. */
  source: string;
  /** Human month/year the feedback was collected. */
  collected: string;
  note?: string;
  /** Official TED feedback score, added by hand when available. */
  tedScore?: { value: number; outOf?: number; label?: string } | null;
  questions: ImportedQuestion[];
  responses: ImportedResponse[];
};

export const IMPORTED_FEEDBACK: ImportedFeedbackDataset[] = [
  {
    "eventSlug": "newcastle-2050-salon",
    "title": "Newcastle 2050: What If?",
    "source": "Previous feedback provider (imported)",
    "collected": "May 2026",
    "note": "Salon feedback collected on the night via our previous survey tool.",
    "tedScore": null,
    "questions": [
      {
        "key": "overall",
        "label": "Overall satisfaction",
        "type": "rating",
        "max": 10
      },
      {
        "key": "industry",
        "label": "Industry aligned with",
        "type": "choice"
      },
      {
        "key": "enjoyed",
        "label": "Aspects done particularly well",
        "type": "multiselect"
      },
      {
        "key": "eng_health",
        "label": "Engagement: Health and Wellbeing",
        "type": "rating",
        "max": 5
      },
      {
        "key": "eng_night",
        "label": "Engagement: Night Economy",
        "type": "rating",
        "max": 5
      },
      {
        "key": "eng_transport",
        "label": "Engagement: Transport",
        "type": "rating",
        "max": 5
      },
      {
        "key": "agree_share",
        "label": "I was able to share my ideas",
        "type": "rating",
        "max": 5
      },
      {
        "key": "agree_perspectives",
        "label": "Exposed to perspectives I hadn't considered",
        "type": "rating",
        "max": 5
      },
      {
        "key": "agree_mix",
        "label": "The mix of activities supported meaningful engagement",
        "type": "rating",
        "max": 5
      },
      {
        "key": "barriers",
        "label": "Anything that made it hard to participate fully",
        "type": "text"
      },
      {
        "key": "improve",
        "label": "What could we improve for future events",
        "type": "text"
      },
      {
        "key": "anything_else",
        "label": "Anything else about your experience",
        "type": "text"
      }
    ],
    "responses": [
      {
        "submittedAt": "May 2, 2026",
        "name": null,
        "answers": {
          "overall": 8,
          "industry": "Professional services and travel",
          "enjoyed": [
            "Event Atmosphere",
            "Tactile Activities"
          ],
          "eng_health": 4,
          "eng_night": 4,
          "eng_transport": 3,
          "agree_share": 4,
          "agree_perspectives": 4,
          "agree_mix": 2,
          "barriers": "There were too many activities for each station and no clear structure on when we are switching",
          "improve": "Let facilitators facilitate without pushing their own narrative too much.",
          "anything_else": "It would be good to have visibility if any ideas do move forward from this"
        }
      },
      {
        "submittedAt": "May 1, 2026",
        "name": null,
        "answers": {
          "overall": 10,
          "industry": "Health",
          "enjoyed": [
            "Event Atmosphere",
            "Tactile Activities",
            "Written Activities",
            "Facilitators",
            "Event Structure",
            "Networking Opportunities"
          ],
          "eng_health": 5,
          "eng_night": 5,
          "eng_transport": 5,
          "agree_share": 5,
          "agree_perspectives": 5,
          "agree_mix": 5,
          "barriers": "No",
          "improve": "Not sure, great time frame and format",
          "anything_else": "The food was amazing. Thanks to Kingfisher!"
        }
      },
      {
        "submittedAt": "May 1, 2026",
        "name": null,
        "answers": {
          "overall": 10,
          "industry": "Arts",
          "enjoyed": [
            "Event Atmosphere",
            "Tactile Activities",
            "Written Activities",
            "Facilitators",
            "Event Structure",
            "Networking Opportunities"
          ],
          "eng_health": 5,
          "eng_night": 5,
          "eng_transport": 5,
          "agree_share": 5,
          "agree_perspectives": 5,
          "agree_mix": 5,
          "barriers": "No, I felt well supported at all times. Directions were clear and accessible.",
          "improve": "Nothing. Thank you for a great event, Newcastle needs more of this.",
          "anything_else": "Wonderful. Well done to all involved."
        }
      },
      {
        "submittedAt": "May 1, 2026",
        "name": null,
        "answers": {
          "overall": 7,
          "industry": "Healthcare",
          "enjoyed": [
            "Event Atmosphere",
            "Tactile Activities",
            "Written Activities",
            "Event Structure"
          ],
          "eng_health": 3,
          "eng_night": 3,
          "eng_transport": 3,
          "agree_share": 5,
          "agree_perspectives": 4,
          "agree_mix": 3,
          "barriers": "No",
          "improve": "Ideally each activity should be followed, or perhaps preceded by a mini-lecture from an expert or guest speaker on the topic.\n\nThe conversation amongst participants would be enhanced by hearing about what's already happening, what's possible, and what's happening in similar spaces nationally/internationally.",
          "anything_else": null
        }
      },
      {
        "submittedAt": "May 1, 2026",
        "name": null,
        "answers": {
          "overall": 9,
          "industry": "Administration and home services",
          "enjoyed": [
            "Event Atmosphere",
            "Written Activities",
            "Facilitators",
            "Event Structure",
            "Networking Opportunities"
          ],
          "eng_health": 4,
          "eng_night": 4,
          "eng_transport": 4,
          "agree_share": 5,
          "agree_perspectives": 5,
          "agree_mix": 5,
          "barriers": "No",
          "improve": "Name tags!!",
          "anything_else": null
        }
      },
      {
        "submittedAt": "May 1, 2026",
        "name": null,
        "answers": {
          "overall": 9,
          "industry": "Nightlife",
          "enjoyed": [
            "Event Atmosphere",
            "Tactile Activities",
            "Written Activities",
            "Facilitators",
            "Event Structure",
            "Networking Opportunities"
          ],
          "eng_health": 3,
          "eng_night": 5,
          "eng_transport": 3,
          "agree_share": 5,
          "agree_perspectives": 4,
          "agree_mix": 5,
          "barriers": "I only attended the nightlife session before having to leave but it was well run",
          "improve": "Photobooth?",
          "anything_else": "Great event, well done!"
        }
      }
    ]
  },
  {
    "eventSlug": "reframe-2025",
    "title": "TEDxCooksHill: Reframe",
    "source": "Previous feedback provider (imported)",
    "collected": "October 2025",
    "note": "Post-event survey from our 2025 flagship, collected via our previous survey tool.",
    "tedScore": null,
    "questions": [
      {
        "key": "overall",
        "label": "Overall event rating",
        "type": "rating",
        "max": 5
      },
      {
        "key": "speakers",
        "label": "Speakers and topic(s) rating",
        "type": "rating",
        "max": 5
      },
      {
        "key": "fav_talk",
        "label": "Favourite talk / performance",
        "type": "text"
      },
      {
        "key": "catering",
        "label": "Catering rating",
        "type": "rating",
        "max": 5
      },
      {
        "key": "breaks",
        "label": "Length of the breaks between sessions",
        "type": "choice"
      },
      {
        "key": "price",
        "label": "Appropriate ticket price",
        "type": "choice"
      },
      {
        "key": "future_topics",
        "label": "Topics you'd like to see in future",
        "type": "text"
      },
      {
        "key": "future_speakers",
        "label": "Speakers who would suit our TEDx event",
        "type": "text"
      },
      {
        "key": "quarterly",
        "label": "Interested in frequent (quarterly) events",
        "type": "boolean"
      },
      {
        "key": "other",
        "label": "Other feedback or ideas",
        "type": "text"
      },
      {
        "key": "community",
        "label": "Interested in being part of the TEDx community",
        "type": "choice"
      },
      {
        "key": "contact",
        "label": "Contact left (email / phone)",
        "type": "text"
      }
    ],
    "responses": [
      {
        "submittedAt": "Nov 2, 2025",
        "name": "Luke Masiello",
        "answers": {
          "overall": 2,
          "speakers": 1,
          "fav_talk": null,
          "catering": 4,
          "breaks": "Perfect amount of time",
          "price": "$100 - $130",
          "future_topics": "Buisness focused talks from successful young names in the space",
          "future_speakers": null,
          "quarterly": true,
          "other": "I personally prefer to learn more and hear from successful people about their journey, and how I can apply their stories to my life, rather than silly entertainment speakers who appeal to mums.",
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 31, 2025",
        "name": "Tamara",
        "answers": {
          "overall": 4,
          "speakers": 4,
          "fav_talk": "Splash of colour",
          "catering": 4,
          "breaks": "Too long",
          "price": "Less than $80",
          "future_topics": "Proactive thinking for emerging disruptions",
          "future_speakers": "There are some great futures focused public servants in hunter region.",
          "quarterly": true,
          "other": "Im a strong supporter of giving new voices and new ideas a stage presence. However I think the tedX Cookshill event could benefit from an opening key note to set the scene. Speaker no 1 this year didn't do that for me  \nI also felt some of the 10 talks were not 100% clear on what their value proposition was and i struggled to capture their idea.. I think the answer is in the speakers coach helping themn structure their talk..  \nBut thank you from bringing the ideas festival to newcastle!!!",
          "community": "Yes, please contact me",
          "contact": "Tamara.lee@health.nsw.gov.au"
        }
      },
      {
        "submittedAt": "Oct 30, 2025",
        "name": null,
        "answers": {
          "overall": 5,
          "speakers": 5,
          "fav_talk": "Brittney Saunders",
          "catering": 5,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": null,
          "future_speakers": null,
          "quarterly": true,
          "other": "Trudi the MC of the day was fantastic and did a great job.\n\nI was sad to see empty seats and wondered if the price was a little less you may fill the place up - when you take out sponsors and giveaways I imagine you would need more paying guests. The catering was fantastic but perhaps shave some there - pay for a drink yourselves or less sweets in the afternoon box just to make it a little less at ticket price.",
          "community": "Yes, please contact me",
          "contact": "kelly@kellydray.com"
        }
      },
      {
        "submittedAt": "Oct 30, 2025",
        "name": null,
        "answers": {
          "overall": 4,
          "speakers": 4,
          "fav_talk": "Welcome to country",
          "catering": 5,
          "breaks": "Too long",
          "price": "I don't mind",
          "future_topics": "More on current innovation",
          "future_speakers": null,
          "quarterly": true,
          "other": null,
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Emma Holgate",
        "answers": {
          "overall": 5,
          "speakers": 5,
          "fav_talk": "Dr Kate Cashman , Harry Garside and also the drumming",
          "catering": 5,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": null,
          "future_speakers": null,
          "quarterly": false,
          "other": null,
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Elle",
        "answers": {
          "overall": 4,
          "speakers": 5,
          "fav_talk": "Harry Garside and Dr Cate",
          "catering": 4,
          "breaks": "Too long",
          "price": "$80 - $100",
          "future_topics": "Social cohesion",
          "future_speakers": null,
          "quarterly": true,
          "other": "Thanks so much for putting it on. I really enjoyed it",
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Stacey Brodbeck",
        "answers": {
          "overall": 4,
          "speakers": 4,
          "fav_talk": "Harry Garside and the drum guy",
          "catering": 4,
          "breaks": "Too long",
          "price": "not sure what a marquee event is..If like this one than under $100",
          "future_topics": "something with a positive environmental bent, housing affordability",
          "future_speakers": "Cameron Murray (runs Fresh Economic Thinking)",
          "quarterly": true,
          "other": "I know catering is difficult for so many but I would have preferred the salad wasn't in plastic containers although understand if not possible. Those Chinese food containers can normally not be recycled. Clearer marking of what could go in each bin (as in which part of what we used could be recycled) could have had an educational benefit for a group of people well positioned to spread the word. MC was great - vibrant, friendly and engaging.",
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Rhett Morson",
        "answers": {
          "overall": 2,
          "speakers": 3,
          "fav_talk": "blood vessels",
          "catering": 2,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": "philosophy",
          "future_speakers": null,
          "quarterly": true,
          "other": "the acknowledgment of country was too long, the facilitator was too fake",
          "community": "Yes, please contact me",
          "contact": "rhett.morson@gmail.com"
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Cain Emslie",
        "answers": {
          "overall": 5,
          "speakers": 5,
          "fav_talk": "Benji and Harry",
          "catering": 5,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": "Rebound - People who have been down and out but bounced back",
          "future_speakers": null,
          "quarterly": true,
          "other": null,
          "community": "Yes, please contact me",
          "contact": "cainems81@gmail.com"
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Shivani",
        "answers": {
          "overall": 5,
          "speakers": 5,
          "fav_talk": "Tristan McLindon magic show, Harry Garside natural/funny speaking style and Brittney Saunders story and her attitude",
          "catering": 4,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": "maybe about how to handle stress, healing and moving on from an event of setbacks",
          "future_speakers": "NA",
          "quarterly": true,
          "other": "I thoroughly enjoyed my first-ever TEDx event. I came alone with no expectations, and it far exceeded them. I gained so many valuable insights, and the experience has left a lasting, positive impression that I’ll always remember, and that in itself is powerful.",
          "community": "Yes, please contact me",
          "contact": "shivani.vram@outlook.com"
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Matt Taylor",
        "answers": {
          "overall": 5,
          "speakers": 4,
          "fav_talk": "Ennia Jones, Tristan McLindon",
          "catering": 5,
          "breaks": "Perfect amount of time",
          "price": "$80 - $100",
          "future_topics": "Generational differences, especially in relation to work",
          "future_speakers": null,
          "quarterly": true,
          "other": "* I think holding the event on a Sunday did not work as well. \n* Venue was great.\n* Not sure about the MC - she was good but maybe a little over the top. All she needed to do was introduce and summarise each talk. The extra bits were unnecessary and at times awkward.\n* Since the event I have had many people say to me \"I would have gone but didn't know it was on\".",
          "community": "I'm happy just attending",
          "contact": null
        }
      },
      {
        "submittedAt": "Oct 29, 2025",
        "name": "Bernice Marshall",
        "answers": {
          "overall": 4,
          "speakers": 4,
          "fav_talk": "Harry Garside & Brittney",
          "catering": 5,
          "breaks": "Too long",
          "price": "$80 - $100",
          "future_topics": null,
          "future_speakers": null,
          "quarterly": true,
          "other": "I would only be interested in attending more frequent events if they were for shorter durations. For example, I would happily purchase one ticket that entitled me to attend 3 or 4 shorter evening sessions over, say, a month, rather than one very long day.",
          "community": "I'm happy just attending",
          "contact": null
        }
      }
    ]
  }
];

/** Look up an imported feedback archive by event slug. */
export function importedFeedbackForSlug(
  slug: string,
): ImportedFeedbackDataset | undefined {
  return IMPORTED_FEEDBACK.find((d) => d.eventSlug === slug);
}
