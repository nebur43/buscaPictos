export const searchPictograms = async (query) => {
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${encodedQuery}`);
    if (!response.ok) {
      if (response.status === 404) return []; // No results found
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data
      .filter(item => !item.violence && !item.sex)
      .map(item => ({
        id: item._id,
        imageUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
        keywords: item.keywords.map(k => k.keyword),
        score: item.score || 0
      }));
  } catch (error) {
    console.error("Error searching pictograms:", error);
    throw error;
  }
};
