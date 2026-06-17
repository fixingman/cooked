import type { PantryItem } from "@/types/pantry";

export type PantryCategory = NonNullable<PantryItem["category"]>;

export const CATEGORY_LABELS: Record<PantryCategory, string> = {
  fruit:       "Fruit",
  vegetables:  "Vegetables",
  dairy:       "Dairy",
  meat:        "Meat & Fish",
  grains:      "Grains & Pasta",
  legumes:     "Legumes",
  spices:      "Spices & Herbs",
  baking:      "Baking",
  pantry:      "Oils & Condiments",
  nuts:        "Nuts & Seeds",
  canned:      "Canned & Jars",
  dried:       "Dried",
  frozen:      "Frozen",
  other:       "Misc",
};

export const CATEGORY_ORDER: PantryCategory[] = [
  "fruit", "vegetables", "dairy", "meat", "grains", "legumes",
  "spices", "baking", "pantry", "nuts", "canned", "dried", "frozen", "other",
];

const RAW: Array<[PantryCategory, string[]]> = [
  ["fruit", [
    "apple", "apples", "pear", "pears", "banana", "bananas",
    "orange", "oranges", "mandarin", "clementine", "grapefruit",
    "lemon", "lemons", "lime", "limes",
    "berries", "mixed berries", "berry",
    "strawberries", "strawberry", "blueberries", "blueberry",
    "raspberries", "raspberry", "blackberries", "blackberry", "cherries", "cherry",
    "grapes", "mango", "mangoes", "pineapple", "papaya", "kiwi",
    "peach", "peaches", "plum", "plums", "apricot", "apricots", "nectarine",
    "melon", "watermelon", "fig", "figs", "pomegranate", "passion fruit",
  ]],
  ["vegetables", [
    // Alliums
    "garlic", "onion", "onions", "shallots", "spring onions", "leek",
    // Root veg
    "carrot", "carrots", "potato", "potatoes", "sweet potato", "sweet potatoes",
    "beetroot", "parsnip", "turnip", "celeriac", "radish", "rädisor",
    // Brassicas
    "broccoli", "cauliflower", "cabbage", "brussels sprouts", "kale",
    // Leafy
    "spinach", "lettuce", "arugula", "rocket", "chard", "watercress",
    // Fruiting veg
    "tomato", "tomatoes", "cherry tomatoes", "peppers", "pepper", "chilli", "chili",
    "chillies", "courgette", "zucchini", "aubergine", "eggplant", "cucumber",
    "avocado", "corn", "peas", "green beans", "broad beans", "asparagus",
    // Fungi
    "mushrooms", "mushroom", "chestnut mushrooms", "shiitake", "portobello",
    // Celery & fennel
    "celery", "fennel",
    // Fresh herbs
    "basil", "parsley", "coriander", "mint", "thyme", "rosemary",
    "dill", "chives", "tarragon", "sage", "oregano", "bay leaves", "bay leaf",
    // Aromatics
    "ginger", "fresh ginger", "lemongrass", "galangal",
  ]],
  ["dairy", [
    "milk", "oat milk", "almond milk", "soy milk",
    "cream", "heavy cream", "double cream", "single cream", "whipping cream",
    "sour cream", "crème fraîche",
    "yogurt", "greek yogurt",
    "cheddar", "parmesan", "mozzarella", "feta", "goat cheese", "brie",
    "cream cheese", "ricotta", "mascarpone", "halloumi",
    "eggs", "egg", "butter", "ghee",
  ]],
  ["meat", [
    "chicken breast", "chicken thighs", "chicken", "whole chicken",
    "minced beef", "beef steak", "beef", "ground beef",
    "pork belly", "pork chops", "pork", "bacon", "pancetta", "ham", "prosciutto",
    "lamb", "lamb chops", "veal", "duck", "turkey",
    "salmon", "cod", "tuna", "trout", "sea bass", "sea bream", "mackerel",
    "haddock", "halibut", "sardines", "anchovies",
    "prawns", "shrimp", "mussels", "clams", "scallops", "squid", "crab", "lobster",
    "tofu", "tempeh", "seitan",
  ]],
  ["grains", [
    "flour", "bread flour", "wholemeal flour", "plain flour", "self-raising flour",
    "cornmeal", "semolina", "polenta",
    "rice", "basmati rice", "jasmine rice", "brown rice", "arborio rice", "wild rice",
    "pasta", "spaghetti", "penne", "fusilli", "tagliatelle", "lasagne sheets",
    "rigatoni", "farfalle", "orzo",
    "couscous", "quinoa", "bulgur wheat", "farro", "spelt",
    "oats", "rolled oats", "porridge oats",
    "breadcrumbs", "panko",
    "bread", "sourdough", "tortillas", "wraps", "pita bread",
    "noodles", "ramen", "udon", "soba", "rice noodles",
  ]],
  ["legumes", [
    // Canned / cooked
    "chickpeas", "black beans", "kidney beans", "cannellini beans", "butter beans",
    "borlotti beans", "black-eyed peas", "edamame",
    // Dried
    "dried lentils", "red lentils", "green lentils", "puy lentils", "brown lentils",
    "dried chickpeas", "dried black beans", "dried kidney beans",
    "split peas", "mung beans",
    // Fresh
    "lentils",
  ]],
  ["spices", [
    "salt", "sea salt", "black pepper", "white pepper",
    "chilli flakes", "red pepper flakes", "cayenne", "cayenne pepper", "chilli powder",
    "cumin", "ground cumin", "cumin seeds",
    "ground coriander", "coriander seeds",
    "paprika", "smoked paprika", "sweet paprika",
    "turmeric", "cinnamon", "nutmeg", "cardamom", "cloves",
    "allspice", "mixed spice", "five spice",
    "curry powder", "garam masala", "za'atar", "sumac", "ras el hanout",
    "fennel seeds", "mustard seeds", "nigella seeds", "caraway seeds",
    "star anise", "saffron",
    "dried thyme", "dried basil", "dried rosemary", "dried parsley",
    "dried oregano", "dried mint", "dried dill",
  ]],
  ["baking", [
    "sugar", "brown sugar", "caster sugar", "icing sugar", "demerara sugar",
    "honey", "maple syrup", "golden syrup", "agave", "molasses", "treacle",
    "baking powder", "baking soda", "bicarbonate of soda",
    "yeast", "instant yeast", "dried yeast",
    "vanilla extract", "vanilla bean", "vanilla paste",
    "cocoa powder", "dark chocolate", "milk chocolate", "white chocolate", "chocolate chips",
    "cornflour", "cornstarch", "arrowroot", "gelatin", "agar",
    "desiccated coconut",
  ]],
  ["pantry", [
    // Oils & fats
    "olive oil", "extra virgin olive oil", "vegetable oil", "sunflower oil",
    "coconut oil", "sesame oil", "rapeseed oil", "lard",
    // Vinegars
    "balsamic vinegar", "red wine vinegar", "white wine vinegar",
    "apple cider vinegar", "rice vinegar", "sherry vinegar", "vinegar",
    // Condiments & sauces
    "soy sauce", "tamari", "fish sauce", "worcestershire sauce",
    "hot sauce", "tabasco", "sriracha",
    "dijon mustard", "wholegrain mustard", "mustard", "mayonnaise",
    "ketchup", "tomato ketchup", "barbecue sauce",
    "miso paste", "miso", "tahini", "oyster sauce", "hoisin sauce",
    "teriyaki sauce", "ponzu",
    // Wine & cooking liquids
    "white wine", "red wine", "dry sherry", "mirin", "rice wine", "sake",
  ]],
  ["nuts", [
    "almonds", "walnuts", "cashews", "pine nuts", "hazelnuts", "peanuts",
    "pecans", "pecan nuts", "pistachios", "macadamia", "macadamia nuts",
    "brazil nuts", "chestnuts", "mixed nuts",
    "sesame seeds", "pumpkin seeds", "sunflower seeds", "flaxseed", "chia seeds",
    "hemp seeds", "poppy seeds", "mixed seeds",
    "peanut butter", "almond butter", "cashew butter",
  ]],
  ["canned", [
    // Canned veg & fruit
    "chopped tomatoes", "canned tomatoes", "tomato paste", "tomato purée", "tomato puree",
    "coconut milk", "coconut cream",
    "canned corn", "canned artichokes",
    // Stocks
    "chicken stock", "vegetable stock", "beef stock", "fish stock", "stock",
    "chicken broth", "vegetable broth", "beef broth",
    // Preserved / jarred
    "roasted peppers", "artichoke hearts", "capers",
    "olives", "black olives", "green olives", "pesto", "passata",
    "sardines in oil", "tuna in oil",
  ]],
  ["dried", [
    // Dried fruit
    "raisins", "sultanas", "currants", "dried apricots", "dried mango",
    "dried cranberries", "dried blueberries", "dried cherries",
    "dates", "prunes", "dried figs",
    // Dried veg & fungi
    "dried mushrooms", "porcini mushrooms", "dried chilies", "dried chilli",
    "sun-dried tomatoes", "dried tomatoes",
    // Other dried
    "desiccated coconut", "coconut flakes",
  ]],
  ["frozen", [
    "frozen peas", "frozen corn", "frozen spinach", "frozen berries",
    "frozen edamame", "frozen broccoli", "frozen mixed veg",
    "ice cream", "frozen yogurt",
    "frozen chips", "frozen fish", "frozen prawns", "frozen chicken",
    "frozen pizza dough",
  ]],
];

const LOOKUP = new Map<string, PantryCategory>();
for (const [cat, names] of RAW) {
  for (const n of names) LOOKUP.set(n.toLowerCase(), cat);
}

const PREP_PREFIX = /^(fresh|dried|ground|whole|frozen|raw|cooked|organic|baby|mini|chopped|sliced|diced|crushed|minced)\s+/i;

export function inferCategory(name: string): PantryCategory {
  const normalised = name.trim().toLowerCase();
  if (LOOKUP.has(normalised)) return LOOKUP.get(normalised)!;
  // Strip a single prep/descriptor prefix and try again ("fresh basil" → "basil")
  const stripped = normalised.replace(PREP_PREFIX, "");
  return LOOKUP.get(stripped) ?? "other";
}
