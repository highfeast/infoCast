import markdownIt from "markdown-it";

export const extractTableData = (htmlString: string) => {
  const menuItems = [];
  const rows = htmlString.match(/<tr>.*?<\/tr>/gs);

  if (rows) {
    for (const row of rows) {
      const columns = row.match(/<td[^>]*>.*?<\/td>/gs);
      if (columns && columns.length >= 4) {
        const item = columns[0].replace(/<\/?[^>]+(>|$)/g, ""); // Removing HTML tags
        const quantity = columns[1].replace(/<\/?[^>]+(>|$)/g, "");
        const unitPrice = columns[2].replace(/<\/?[^>]+(>|$)/g, "");
        const totalPrice = columns[3].replace(/<\/?[^>]+(>|$)/g, "");
        menuItems.push({ item, quantity, unitPrice, totalPrice });
      }
    }
  }
  return menuItems.filter((menuItem) => menuItem.item !== "TOTAL");
};
export function toHTML(markdownText: string) {
  const md = new markdownIt();
  return md.render(markdownText);
}

export const exportTable = (name: string) => {
  const table = document.getElementById(name);
  const blob = new Blob([table!.outerHTML], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateMemoryKey = (userID: string, sessionKey: string) =>
  `${userID}-${sessionKey}`;

export const measuringUnits = `
Condiment,Unit,Standard Size,Large Size,Small Size
Vegetable oil,Gallon,25 liters,10 liters,1-5 liters
Rice,Bag (kg),50 kg,50 kg,25 kg
Tomato (Tin),Tin (Kg),2.2 Kg,800 g,40 g
Tomato (Fresh),Basket (Kg),60 Kg,40 Kg,25 Kg
Red bell peppers,Painter,1 kg,2.5 kg,
Dry black Pepper,Packet (g),500 g,250 g,100 g
Emma Coconut flavour,Sachet (g),50 g,50 g,
Mivina,Piece,100 g,100 g,10 g
Ducrous Curry,Big Packet,1 kg,800 g,20 g
Thyme,Packet,250 g,50 g,5 g
Dry Shallot,Big Packet,250 g,125 g,
Dry Onions,Big Packet,250 g,125 g,
Knorr,Packet,400 g,,8 g
Mixed Spice,Bottle,1 bottle,,
Nut Meg,Packet,500 g,155 g,30 g
Dry Bay Leaves,Packet,125 g,,10 g
Dry Rosemary,Packet,200 g,35 g,10 g
Royco,Packet,400 g,,4 g
Fresh Ginger,Painter,1 kg,250 g,150 g
Garlic,Painter,1 kg,150 g,80 g
Onion,Bag,100 kg,170 g,125 g
Chicken Maggi,Packet,400 g,,4 g
Benny Flavor,Packet,714 g,,17 g
`;


export const removePrefix = (response: any) => {
  const index = response.indexOf(':');
  if (index !== -1) {
    return response.substring(index + 1).trim();
  } else {
    return response.trim();
  }
}