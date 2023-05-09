const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// lists the dishes
function list(req, res) {
    res.json({ data: dishes })
    
    
}
//validator for if the id entered is a valid id
function dishExists(req, res, next) {
    const {dishId} = req.params
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dishes = foundDish
       next()
      } 
        next({
          status: 404
          
        })
}

// sends a single dish
function read(req, res) {
    const { dishId } = req.params;
    const foundDish = res.locals.dishes
    res.json({ data:foundDish })
}

// checks that all properties are present before creating a new dish
function bodyDataHas(property){
    return function (req, res, next){
        const {data = {}} = req.body
        if(data[property]){
            return next()
        }
        next({status: 400, message:`must include a ${property}`})
    }
}

// validator to check if price is valid
function priceValidator(req, res, next){
    const { data: {price} = {} } = req.body
    if(price > 0){
        next()
    }else{
        next({
            status: 400,
            message: "price"
        })
    }
}


//creates a new dish
function create(req, res){
    const{data: { name, description, price, image_url}= {} } = req.body
    newId = nextId()
    const newDish = {
        id: newId,
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish })
}

function priceIsANumber(req, res, next){
    const { data: {price} = {} } = req.body
    if(typeof price === "number"){
        next()
    }else{
       next({
        status:400,
        message:"price"
        
       }) 
    }
}

// checks if data.id and :dishId are matching
 function matchingIds(req, res, next){
     const {dishId} = req.params
     const { data: {id} = {} } = req.body
    if (id && id !== dishId) {
    return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
      });
    }
     else{
         next()
     }
 }

function update(req, res, next){
    const foundDish = res.locals.dishes
    const { data:  { name, description, price, image_url} = {}} = req.body 
   
    //update the dish
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish })
}


module.exports = {
    list,
    read:[dishExists, read],
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceValidator,
        create
    ],
    update: [
        dishExists,
        matchingIds,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceValidator,
        priceIsANumber,
        update,
    ],
    
}