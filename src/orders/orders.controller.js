const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next){
    res.json({ data: orders })
}

function orderExists(req, res, next){
    const { orderId } = req.params
    const foundOrder = orders.find(order => order.id === orderId)
    res.locals.orders = foundOrder
    if(foundOrder){
        next()
    }else{
        next({
            status: 404,
            message:"could not find order with that id"
        })
    }
}
function read(req, res, next){
    const { orderId } = req.params
    const foundOrder = res.locals.orders
    res.json({ data: foundOrder })
}


//validator for checking the parameters have data
function bodyDataHas(property){
    return function(req, res, next){
        const {data = {} }= req.body
        if (data[property]){
            return next()
        }
        else{
            next({
                status: 400,
                message: `Order must include a ${property}`
            })
        }
    }
}

function create(req, res, next){
    const{ data: { deliverTo, mobileNumber, status, dishes } = {}} = req.body
    const newId = nextId()
    const updatedDishes = dishes.map((dish, index)=>{
        const {name, description, image_url} = dish
        const quantity = dish.quantity || 1
        const price = dish.price
        return {name, description ,image_url, price, quantity}
    })
    
    const newOrder = {
        id: newId,
        deliverTo,
        mobileNumber,
        status,
        dishes: updatedDishes
    }

    orders.push(newOrder)
    res.status(201).json({ data:newOrder })
}


function dishesArrayValidator(req, res, next){
    const {data: {dishes}={}} = req.body
    if (!Array.isArray(dishes) || dishes.length === 0){
        return next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    for (let i = 0; i < dishes.length; i++) {
        const { quantity } = dishes[i]
        if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
          return next({
            status: 400,
            message: `Dish ${i} must have a quantity that is an integer greater than 0`
          })
        }
      }
    next()
}

function matchingIds(req, res, next){
    const {orderId} = req.params
    const { data: {id} = {} } = req.body
   if (id && id !== orderId) {
   return next({
       status: 400,
       message: `order id does not match route id. order: ${id}, Route: ${orderId}`
     });
   }
    else{
        next()
    }
}

function validateStatus(req, res, next){
    const { data: {status} = {}} = req.body
    if(status === "delivered"){
        return next({
            status: 400,
            message:"A delivered order cannot be changed"
        })
    }
    if(status === "pending" || status === "preparing" || status === "out-for-delivery" ){
        return next()
    }
    else{
        return next({
            status: 400,
            message:"Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    }
}

function update(req, res, next){
    const{ data: { deliverTo, mobileNumber, status, dishes } = {}} = req.body
    const { orderId } = req.params
    
    const foundOrder = res.locals.orders
    //update the order
    foundOrder.deliverTo = deliverTo
    foundOrder.mobileNumber = mobileNumber
    foundOrder.status = status
    foundOrder.dishes = dishes

    res.json({ data: foundOrder })

}
function validateDelete(req, res, next){
    const {orderId} = req.params
    const foundOrder = orders.find(order => orderId === order.id)
    if(!foundOrder){
        next({
            status:404,
            message:`${orderId}`
        })
    }
    if(foundOrder.status === "pending"){
     return next()
    }else{
        next({
            status:400,
            message: "An order cannot be deleted unless it is pending."
        })
    }
}

function destroy(req, res){
    const {orderId} = req.params
    const {data: {status}= {}}= req.body
        const index = orders.findIndex( order => order.id === orderId)
        orders.splice(index, 1)
        res.sendStatus(204)
    
}



module.exports = {
    list,
    read: [orderExists, read],
    create: [
        bodyDataHas('deliverTo'),
        bodyDataHas('mobileNumber'),
        bodyDataHas('dishes'),
        
        dishesArrayValidator,
        create
    ],
    update: [
        orderExists,
        matchingIds,
        bodyDataHas('deliverTo'),
        bodyDataHas('mobileNumber'),
        bodyDataHas('dishes'),
        dishesArrayValidator,
        validateStatus,
        update
    ],
    delete:[
        validateDelete,
        destroy
    ]
}