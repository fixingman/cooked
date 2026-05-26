import type { PantryItem } from "@/types/pantry";

export type PantryCategory = NonNullable<PantryItem["category"]>;

export const CATEGORY_LABELS: Record<PantryCategory, string> = {
  produce:  "Produce",
  dairy:    "Dairy",
  meat:     "Meat & Fish",
  pantry:   "Pantry",
  frozen:   "Frozen",
  other:    "Other",
};

export const CATEGORY_ORDER: PantryCategory[] = [
  "produce", "dairy", "meat", "pantry", "frozen", "other",
];

// Lookup: lowercase ingredient name → category
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
  ["frozen", [
    "frozen peas", "frozen corn", "frozen spinach", "frozen berries",
    "ice cream", "frozen chips", "frozen fish",
  ]],
  ["pantry", [
    // Oils & fats
    "olive oil", "vegetable oil", "sunflower oil", "coconut oil", "sesame oil", "lard",
    // Grains & pasta
    "flour", "bread flour", "wholemeal flour", "cornmeal", "semolina",
    "rice", "basmati rice", "jasmine rice", "brown rice", "arborio rice",
    "pasta", "spaghetti", "penne", "fusilli", "tagliatelle", "lasagne sheets",
    "couscous", "quinoa", "oats", "breadcrumbs", "panko",
    // Baking
    "sugar", "brown sugar", "caster sugar", "icing sugar", "honey", "maple syrup",
    "baking powder", "baking soda", "bicarbonate of soda", "yeast", "vanilla extract",
    "cocoa powder", "dark chocolate", "chocolate", "cornflour", "cornstarch", "gelatin",
    // Pulses & canned
    "chickpeas", "black beans", "kidney beans", "lentils", "cannellini beans",
    "chopped tomatoes", "coconut milk", "tomato paste", "tomato purée", "tomato puree",
    "chicken stock", "vegetable stock", "beef stock", "stock",
    // Spices
    "salt", "black pepper", "white pepper", "chilli flakes", "red pepper flakes",
    "cumin", "ground cumin", "coriander", "ground coriander", "paprika", "smoked paprika",
    "turmeric", "cinnamon", "nutmeg", "cardamom", "cloves", "bay leaves", "bay leaf",
    "oregano", "dried thyme", "dried basil",
    "curry powder", "garam masala", "five spice", "za'atar", "sumac",
    // Condiments
    "soy sauce", "fish sauce", "worcestershire sauce", "hot sauce", "tabasco",
    "dijon mustard", "wholegrain mustard", "mustard", "mayonnaise", "ketchup",
    "balsamic vinegar", "red wine vinegar", "white wine vinegar", "apple cider vinegar", "vinegar",
    "miso paste", "miso", "tahini", "sriracha", "oyster sauce", "hoisin sauce",
    // Wine
    "white wine", "red wine", "dry sherry", "mirin", "rice wine",
    // Nuts & seeds
    "almonds", "walnuts", "cashews", "pine nuts", "hazelnuts", "peanuts",
    "sesame seeds", "pumpkin seeds", "flaxseed", "chia seeds",
    "peanut butter", "almond butter",
    // Dried fruit
    "raisins", "sultanas", "dried apricots", "dates", "cranberries",
  ]],
];

const LOOKUP = new Map<string, PantryCategory>();
for (const [cat, names] of RAW) {
  for (const n of names) LOOKUP.set(n.toLowerCase(), cat);
}

export function inferCategory(name: string): PantryCategory {
  return LOOKUP.get(name.trim().toLowerCase()) ?? "other";
}
