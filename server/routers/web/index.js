module.exports = app => {
  const express = require('express')
  const router = express.Router()
  const mongoose = require('mongoose')
  const Article = mongoose.model('Article')
  const Category = mongoose.model('Category')

  router.get('/articles', async (req, res) => {
    const data = await Article.find()

    res.send(data)
  })

  router.get('/articles/top', async (req, res) => {
    const data = await Article.find().where({
      isTop: true
    }).sort({'createdAt': -1}).limit(6)

    res.send(data)
  })

  router.get('/articles/:pageNum', async (req, res) => {
    const currentPage = req.params.pageNum;
    const list = await Article.find().sort({'createdAt': -1}).skip((currentPage - 1) * 6).limit(6).populate('categories')
    const count = await Article.find().lean().count()
    const totalPage = Math.ceil(count / 6)
    res.send({
      list,
      totalArticles: count,
      totalPage,
      currentPage
    })
  })

  router.get('/article/:id', async (req, res) => {
    const data = await Article.findById(req.params.id).populate('categories')
    res.send(data)
  })

  router.get('/archive', async (req, res) => {
    const data = await Article.aggregate([{
        $group: {
          _id: {
            $year: '$createdAt',
          },
          count: {$sum: 1},
          list: {
            $push: {
              _id: '$_id',
              title: '$title',
              summary: '$summary',
              categories: '$categories',
              createdAt: '$createdAt',
            }
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'categories',
          as: 'categories'
        }
      },
      {$sort: {_id: -1}}
    ])
    // (err, result) => {
    // // Article.populate(result, {
    // //     path: 'list.categories'
    // //   })
    //   result.map(async (item) => {
    //     item.list.map(async (subItem) => {
    //       const categories = subItem.categories;
    //       await categories.map(async (cat, index) => {
    //         const category = await Category.findById(cat)
    //         categories[index] = category
    //       })
    //       console.log(categories)
    //       return subItem
    //     })
    //     return item
    //   })

    //   return result
    // })
    
    res.send(data)
  })

  router.get('/tags', async(req, res) => {
    const data = await Category.aggregate([
      {
        $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: 'categories',
          as: 'tagsList'
        }
      }
    ])

    res.send(data)
  })

  app.use('/web/api', router)
}