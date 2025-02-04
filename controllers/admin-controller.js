const { Restaurant } = require('../models')
const { User } = require('../models')
const { imgurFileHandler } = require('../helpers/file-helpers') // 將 file-helper 載進來

const adminController = {
  getRestaurants: (req, res, next) => {
    Restaurant.findAll({
      raw: true
    })

      .then(restaurants => res.render('admin/restaurants', { restaurants }))

      .catch(err => next(err))
  },
  createRestaurant: (req, res) => {
    return res.render('admin/create-restaurant')
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body

    if (!name) throw new Error('Name為必填欄位')

    const { file } = req // 把檔案從req從取出來

    imgurFileHandler(file) // 將取出的檔案傳給 file-helper (localFileHandler)處理後
      .then(filePath =>
        Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null
        })
      )

      .then(() => {
        req.flash('success_messages', 'restaurant was successfully created')

        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, {
      raw: true
    })

      .then(restaurant => {
        if (!restaurant) throw new Error('此restaurant不存在')

        res.render('admin/restaurant', { restaurant })
      })

      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, {
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error('此restaurant不存在')

        res.render('admin/edit-restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body

    if (!name) throw new Error('Name為必填欄位')

    const { file } = req // 把檔案取出來

    Promise.all([
      // 非同步處理
      Restaurant.findByPk(req.params.id), // 去資料庫查有沒有這間餐廳
      imgurFileHandler(file) // 把檔案傳到 file-helper 處理
    ])
      .then(([restaurant, filePath]) => {
        if (!restaurant) throw new Error('此restaurant不存在')

        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
        })
      })
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully to update')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error('此restaurant不存在')

        return restaurant.destroy()
      })
      .then(() => res.redirect('/admin/restaurants'))
      .catch(err => next(err))
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true
    })
      .then(users => {
        // 判斷is_admin為admin或user，添加了role屬性
        // 使用map一一檢視並增加role屬性
        const userRole = users.map(user => {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            role: user.isAdmin ? 'admin' : 'user'
          }
        })
        res.render('admin/users', { users: userRole })
      })
      .catch(err => next(err))
  },
  patchUser: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) {
          throw new Error('此user不存在')
        }

        if (user.email === 'root@example.com') {
          req.flash('error_messages', '禁止變更 root 權限')
          return res.redirect('back')
        }

        return user.update({
          isAdmin: !user.isAdmin
        })
      })

      .then(() => {
        req.flash('success_messages', '使用者權限變更成功')
        res.redirect('/admin/users')
      })

      .catch(err => next(err))
  }
}

module.exports = adminController
