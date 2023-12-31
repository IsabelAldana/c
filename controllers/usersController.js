const fs = require('fs');
const path = require('path');
const bcryptjs = require("bcryptjs")
const {	validationResult} = require('express-validator');
const User = require('../models/User');
const { localsName } = require('ejs');

const usersFilePath = path.join(__dirname, '../data/Users.json');
const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

const usersController = {

    list: (req,res)=>{
		console.log(req.cookies.userEmail)
        res.render('users/list', { users });
    },

	login: (req, res) => {
		if(res.locals.isLogged) {
			return res.render("users/profile")
		}
		return res.render('users/login');
	},

	loginProcess: (req, res) => {
		let userToLogin = User.findByField('email', req.body.email);

		if(userToLogin) {
			let isOkThePassword = bcryptjs.compareSync(req.body.password, userToLogin.password);
			if (isOkThePassword) {
				delete userToLogin.password;
				req.session.userLogged = userToLogin;

				if(req.body.remember_user) {
					res.cookie('userEmail', req.body.email, { maxAge: (1000 * 60) * 60 })
				}

				return res.redirect('profile');
			} 
			return res.render('users/login', {
				errors: {
					email: {
						msg: 'Las credenciales son inválidas'
					}
				}
			});
		}
		return res.render('users/login', {
			errors: {
				email: {
					msg: 'No se encuentra este email en nuestra base de datos'
				}
			}
		});
	},

    register: (req,res)=>{
        res.render('users/register');

    },

	store: (req, res) => {
		console.log(req.file)
		let newUser = {
		id: users[users.length - 1].id + 1,
			...req.body,
			password: bcryptjs.hashSync(req.body.password, 10),
			image: req.file ? req.file.filename : 'defaultuser.jfif' }
		
			users.push(newUser)
			fs.writeFileSync(usersFilePath, JSON.stringify(users, null, " "))
			res.redirect("/users/list")	
	},

	profile: (req, res) => {
		return res.render('users/myProfile', {
			users: req.session.userLogged
		});
	},
	detail: (req, res) => {
		let idUser = req.params.id;
		let user = users.find(product => product.id == idUser)
		
		res.render("users/myProfile", { users:user })
	},

    editUser: (req, res) => {
		let id = req.params.id
		let editUser = users.find(user => user.id == id)
		res.render("users/editUser", { editUser })
    },
    update: (req, res) => {
		let id = req.params.id 
		let editUser = users.find(user => user.id == id) 
		editUser = {
			id: editUser.id,
			...req.body,
			password: bcryptjs.hashSync(req.body.password, 10),
			image: req.file ? req.file.filename : 'defaultuser.jfif'
		}; 

		let newUsers = users.map(user => {
													 
			if (user.id === editUser.id) {
				return user = { ...editUser };  
			}
			    return user;
		})
		fs.writeFileSync(usersFilePath, JSON.stringify(newUsers, null, ' '));
		res.redirect("/users/list");
	},

	destroy: (req, res) => {
		let id = req.params.id  
		let finalUsers = users.filter(user => user.id != id) 

  		fs.writeFileSync(usersFilePath, JSON.stringify(finalUsers, null, ' '));
		res.redirect("/users/list")
	},
	
	logout: (req, res) => {
		res.clearCookie('userEmail');
		req.session.destroy();
		return res.redirect('/');
	}
}
module.exports = usersController