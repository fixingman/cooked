import type { PantryItem } from "@/types/pantry";

export type PantryCategory = NonNullable<PantryItem["category"]>;

export const CATEGORY_LABELS: Record<PantryCategory, string> = {
  produce:    "Produce",
  dairy:      "Dairy",
  meat:       "Meat & Fish",
  grains:     "Grains & Pasta",
  spices:     "Spices & Herbs",
  baking:     "Baking",
  pantry:     "Oils & Condiments",
  canned:     "Canned & Jars",
  frozen:     "Frozen",
  other:      "Other",
};

export const CATEGORY_ORDER: PantryCategory[] = [
  "produce", "dairy", "meat", "grains", "spices", "baking", "pantry", "canned", "frozen", "other",
];

const RAW: Array<[PantryCategory, string[]]> = [
  ["dairy", [
    "milk", "cream", "heavy cream", "sour cream", "yogurt", "greek yogurt",
    "cheddar", "parmesan", "mozzarella", "feta", "cream cheese", "ricotta",
    "eggs", "egg", "butter", "ghee",
  ]],
  ["meat", [
    "chicken breast", "chicken thighs", "chicken", "minced beef", "beef steak", "beef",
    "pork belly", "pork", "bacon", "pancetta", "lamb", "veal",
    "salmon", "cod", "tuna", "trout", "sea bass", "sea bream", "mackerel", "haddock",
    "prawns", "shrimp", "mussels", "clams", "scallops", "squid", "crab",
    "tofu", "tempeh",
  ]],
  ["produce", [
    "garlic", "onion", "onions", "shallots", "spring onions", "leek",
    "carrot", "carrots", "celery", "potato", "potatoes", "sweet potato",
    "courgette", "zucchini", "aubergine", "eggplant",
    "broccoli", "cauliflower", "spinach", "kale", "lettuce", "arugula", "rocket",
    "tomato", "tomatoes", "cherry tomatoes", "peppers", "pepper", "cucumber",
    "avocado", "mushrooms", "mushroom", "corn", "peas", "green beans", "asparagus",
    "lemon", "lemons", "lime", "limes", "orange", "oranges", "apple", "apples",
    "ginger", "fresh ginger", "chilli", "chili", "chillies",
    "basil", "parsley", "coriander", "mint", "thyme", "rosemary", "dill", "chives",
    "fennel", "beetroot", "artichoke", "celeriac", "turnip",
  ]],
  ["grains", [
    "flour", "bread flour", "wholemeal flour", "cornmeal", "semolina",
    "rice", "basmati rice", "jasmine rice", "brown rice", "arborio rice",
    "pasta", "spaghetti", "penne", "fusilli", "tagliatelle", "lasagne sheets",
    "couscous", "quinoa", "oats", "breadcrumbs", "panko",
    "bread", "sourdough", "tortillas", "noodles", "ramen", "udon",
  ]],
  ["spices", [
    "salt", "black pepper", "white pepper", "chilli flakes", "red pepper flakes",
    "cumin", "ground cumin", "ground coriander", "paprika", "smoked paprika",
    "turmeric", "cinnamon", "nutmeg", "cardamom", "cloves", "bay leaves", "bay leaf",
    "oregano", "dried thyme", "dried basil", "dried rosemary", "dried parsley",
    "curry powder", "garam masala", "five spice", "za'atar", "sumac",
    "allspice", "cayenne", "cayenne pepper", "chilli powder", "mixed spice",
    "fennel seeds", "mustard seeds", "coriander seeds", "cumin seeds",
  ]],
  ["baking", [
    "sugar", "brown sugar", "caster sugar", "icing sugar", "honey", "maple syrup",
    "baking powder", "baking soda", "bicarbonate of soda", "yeast", "vanilla extract",
    "cocoa powder", "dark chocolate", "chocolate", "cornflour", "cornstarch", "gelatin",
    "golden syrup", "molasses", "treacle", "agave",
  ]],
  ["pantry", [
    // Oils & fats
    "olive oil", "vegetable oil", "sunflower oil", "coconut oil", "sesame oil", "lard",
    // Condiments & sauces
    "soy sauce", "fish sauce", "worcestershire sauce", "hot sauce", "tabasco",
    "dijon mustard", "wholegrain mustard", "mustard", "mayonnaise", "ketchup",
    "balsamic vinegar", "red wine vinegar", "white wine vinegar", "apple cider vinegar", "vinegar",
    "miso paste", "miso", "tahini", "sriracha", "oyster sauce", "hoisin sauce",
    // Wine & cooking liquids
    "white wine", "red wine", "dry sherry", "mirin", "rice wine",
    // Nuts, seeds & dried fruit
    "almonds", "walnuts", "cashews", "pine nuts", "hazelnuts", "peanuts",
    "sesame seeds", "pumpkin seeds", "flaxseed", "chia seeds",
    "peanut butter", "almond butter",
    "raisins", "sultanas", "dried apricots", "dates", "cranberries",
  ]],
  ["canned", [
    // Pulses
    "chickpeas", "black beans", "kidney beans", "lentils", "cannellini beans", "butter beans",
    // Canned veg & fruit
    "chopped tomatoes", "tomato paste", "tomato purée", "tomato puree",
    "coconut milk", "corn kernels",
    // Stocks & broths
    "chicken stock", "vegetable stock", "beef stock", "fish stock", "stock",
    "chicken broth", "vegetable broth", "beef broth",
    // Other jarred
    "sun-dried tomatoes", "roasted peppers", "artichoke hearts", "anchovies", "capers",
    "olives", "pesto", "passata",
  ]],
  ["frozen", [
    "frozen peas", "frozen corn", "frozen spinach", "frozen berries",
    "ice cream", "frozen chips", "frozen fish",
  ]],
];

const LOOKUP = new Map<string, PantryCategory>();
for (const [cat, names] of RAW) {
  for (const n of names) LOOKUP.set(n.toLowerCase(), cat);
}

export function inferCategory(name: string): PantryCategory {
  return LOOKUP.get(name.trim().toLowerCase()) ?? "other";
}
