export const MOTIVATION_ITEMS = [
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/ACcXRXwUqJ6Ok/giphy.gif',
    caption: 'JUST DO IT.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    caption: 'STOP THINKING. START SHIPPING.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
    caption: 'YOU WERE DOING SO WELL.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    caption: 'THE TAB YOU WENT TO DOESN\'T CARE ABOUT YOU.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/l4FGGafcOHBp8er3W/giphy.gif',
    caption: 'SHIP IT OR REGRET IT.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/YqE3jbSQQR6x9g19Kj/giphy.gif',
    caption: 'PERFECTION IS THE ENEMY OF DONE.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    caption: 'GET BACK IN.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
    caption: 'NOBODY CARES ABOUT YOUR EXCUSES.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
    caption: 'SHIPPING > PERFECTING.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
    caption: 'FOCUS. SHIP. REPEAT.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    caption: 'YOU\'RE BETTER THAN THIS.',
  },
  {
    type: 'gif' as const,
    url: 'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif',
    caption: 'LESS SCROLLING. MORE BUILDING.',
  },
];

let lastIndex = -1;

export function getRandomMotivation() {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * MOTIVATION_ITEMS.length);
  } while (idx === lastIndex && MOTIVATION_ITEMS.length > 1);
  lastIndex = idx;
  return { item: MOTIVATION_ITEMS[idx], index: idx };
}
