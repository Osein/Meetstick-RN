const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type ProfileEventItem = {
  id: string;
  image: string;
  date: string;
  title: string;
  location: string;
};

export type ProfileEventsResponse = {
  myEvents: ProfileEventItem[];
  pastEvents: ProfileEventItem[];
};

const hikingImage = 'https://www.figma.com/api/mcp/asset/c8e0d5ca-b620-4328-bae8-bb080f500b3e';
const artImage = 'https://www.figma.com/api/mcp/asset/5b1610ee-47f2-4559-b05a-87b5a94f399d';
const coffeeImage = 'https://www.figma.com/api/mcp/asset/76100e9b-325e-4f67-922e-ad719e480ca1';

export const getProfileEventsMock = async (): Promise<ProfileEventsResponse> => {
  await wait(350);

  return {
    myEvents: [
      {
        id: '1',
        image: hikingImage,
        date: 'TOMORROW • 9:00 AM',
        title: 'Saturday Morning Hike',
        location: 'Golden Gate Park'
      },
      {
        id: '2',
        image: artImage,
        date: 'FRI, OCT 24 • 7:00 PM',
        title: 'Modern Art Gallery Tour',
        location: 'SF MOMA'
      },
      {
        id: '3',
        image: coffeeImage,
        date: 'SUN, OCT 26 • 10:00 AM',
        title: 'Coffee & Code Meetup',
        location: 'Sightglass Coffee'
      }
    ],
    pastEvents: []
  };
};
