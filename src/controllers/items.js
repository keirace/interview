// In-memory storage for items (replace with database in production)
let items = [];
let nextId = 1;

// GET all items
export const getAllItems = (req, res) => {
  res.json(items);
};

// GET single item by ID
export const getItemById = (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Item not found'
    });
  }
  res.json(item);
};

// POST create new item
export const createItem = (req, res) => {
  const newItem = {
    id: nextId++,
    name: req.body.name,
    description: req.body.description,
    createdAt: new Date()
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
};

// PUT update item
export const updateItem = (req, res) => {
  const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
  if (itemIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Item not found'
    });
  }

  items[itemIndex] = {
    ...items[itemIndex],
    name: req.body.name,
    description: req.body.description,
    updatedAt: new Date()
  };

  res.json(items[itemIndex]);
};

// DELETE item
export const deleteItem = (req, res) => {
  const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
  if (itemIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Item not found'
    });
  }

  items.splice(itemIndex, 1);
  res.status(204).send();
};
