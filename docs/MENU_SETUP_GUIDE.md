# DaxabitHMS: Menu Engineering & Item Setup Guide

This guide covers everything required to build, organize, customize, and maintain your restaurant's digital food and beverage catalog in **DaxabitHMS**.

---

## 1. Menu Architecture & Hierarchy

DaxabitHMS structures your menu for rapid cashier input and clear kitchen dispatch:

```
┌─────────────────────────────────────────────────────────────┐
│                       MENU CATEGORY                         │
│             (e.g., Starters, Pizzas, Beverages)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│          MENU ITEM          │ │          MENU ITEM          │
│       "Margherita Pizza"    │ │      "Butter Chicken"       │
│  - Price: $14.00 / Half: $8 │ │  - Price: $16.50            │
│  - Tax: 5% (Food rate)      │ │  - Prep Station: Hot Kitchen│
│  - Tag: Veg (Green Dot)     │ │  - Tag: Non-Veg (Red Dot)   │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
       ┌───────┴───────┐                       │
       ▼               ▼                       ▼
┌──────────────┐┌──────────────┐       ┌──────────────┐
│MODIFIER GROUP││MODIFIER GROUP│       │RECIPE (BOM)  │
│"Crust Style" ││"Extra Cheese"│       │- 250g Chicken│
│(Mandatory: 1)││(Optional: +$)│       │- 50g Butter  │
└──────────────┘└──────────────┘       └──────────────┘
```

---

## 2. Managing Categories (`/menu`)

Categories group related food and drinks for both your staff POS terminals and your customer online/kiosk menus.

1. Navigate to **Menu** (`/menu`).
2. Click **Add Category**:
   - **Category Name**: e.g., *Appetizers*, *Tandoor & Grills*, *Wood-Fired Pizza*, *Mocktails & Drinks*.
   - **Sort Order**: Numerical display sequence on the POS screen (1, 2, 3...).
   - **Website / QR Visibility**: Toggle on to display on public ordering menus; toggle off for internal staff-only categories (e.g., *Employee Meals*, *Bar Spoilage*).
3. Click **Save Category**.

---

## 3. Creating & Editing Menu Items

Click **Add Item** inside your selected category:

### General Information
- **Item Name**: Full dish title (e.g. *Paneer Butter Masala*).
- **Short Name / POS Label**: Optional abbreviation for compact receipt slips.
- **Description**: Ingredients, flavors, and cooking style.
- **Dietary Marker**:
  - 🟢 **Vegetarian**: Displays green leaf/dot marker across POS, Kiosk, and Receipts.
  - 🔴 **Non-Vegetarian**: Displays red marker.
  - Optional Vegan and Gluten-Free tags.

### Pricing & Taxes
- **Base Price**: Selling price for standard full portion.
- **Half Price**: Optional pricing if the dish is sold as half-plates or regular vs large.
- **Tax Rate (%)**: Item-specific tax rate (e.g., 5% food rate, 18% liquor rate).
- **Tax Inclusion**: Determined by branch settings (Inclusive vs Exclusive).

### Kitchen Routing
- **Kitchen Prep Station**: Directs where ticket items are routed on the Kitchen Display System (`/kds`):
  - *Main Kitchen*: Curries, gravies, rice, pans.
  - *Tandoor / Grill*: Kebabs, rotis, naans, barbecues.
  - *Pantry / Cold Kitchen*: Salads, desserts, cold starters.
  - *Bar*: Beers, cocktails, soft drinks.

---

## 4. Portions & Flexible Sizing

Daxabit supports versatile portion sizing without cluttering the menu with duplicated entries:
- **Full Portion**: Standard default price.
- **Half Portion**: Pre-configured half price (e.g. *Biryani Half / Full*).
- **Custom Portions**: Add custom portion names (e.g. *Small (8") / Medium (12") / Large (16")*) with exact price adjustments.

When a server taps an item with portions on the POS, a fast touch modal prompts for the desired portion with zero extra clicks.

---

## 5. Modifier Groups & Customizations

Modifiers allow guests to customize their orders (e.g. choice of dressing, temperature, add-ons).

### Creating Modifier Groups
1. In the Item Editor, scroll to **Modifier Groups**.
2. Click **Create / Link Modifier Group**:
   - **Group Name**: e.g., *Choose Your Crust*, *Spice Level*, *Extra Toppings*.
   - **Selection Rules**:
     - **Mandatory (Min = 1, Max = 1)**: Cashier cannot proceed without picking exactly one (e.g. *Meat Cooking Temp: Rare / Med / Well-Done*).
     - **Optional Multi-Select (Min = 0, Max = 5)**: Guest can pick multiple add-ons (e.g. *Extra Cheese (+$1.50), Olives (+$0.75), Jalapeños (+$0.75)*).
3. **Price Adjustments**: Each modifier option can have an added cost (`+$0.00` for free options, or positive amount).
4. **Kitchen Impact**: Modifier notes print clearly on KOT slips and highlight in amber on KDS screens so cooks never miss special instructions.

---

## 6. Combo & Bundled Meals

Create combo packages (e.g., *Lunch Special: Burger + Fries + Soft Drink*):
1. Create a new item and toggle **Is Combo Package**.
2. Set the combo package price (e.g., $12.99).
3. Click **Configure Combo Components**:
   - Link existing items as bundle choices (e.g. Component 1: Choice of Burger; Component 2: Choice of Beverage).
4. When ordered, KDS splits the combo into individual kitchen stations while the bill charges the single bundled price.

---

## 7. Linking Items to Inventory (Recipe BOM)

To enable automatic ingredient deduction when a dish is sold:
1. In the Item Editor, click **Stock When Sold / Recipe**.
2. Add the Bill of Materials (BOM) ingredients and portion quantities:
   - *Example: Margherita Pizza*
     - Pizza Dough: `1 piece`
     - Mozzarella Cheese: `0.150 kg`
     - Pizza Sauce: `0.080 kg`
     - Fresh Basil: `0.010 kg`
3. Click **Save Recipe**.
4. Every time this pizza is rung up and paid on the POS, current inventory stock updates automatically in the background.

