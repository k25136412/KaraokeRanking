export interface iTunesSong {
  trackName: string;
  artistName: string;
}

export const searchSongs = async (term: string): Promise<iTunesSong[]> => {
  if (term.length < 1) return [];
  
  // country=jpで日本のiTunesストアから検索
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&country=jp&lang=ja_jp`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results.map((item: any) => ({
      trackName: item.trackName,
      artistName: item.artistName,
    }));
  } catch (error) {
    console.error('iTunes API Error:', error);
    return [];
  }
};