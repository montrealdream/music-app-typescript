import express, {Express} from "express";
import dotenv from "dotenv";
import {connect} from "./config/database";
import clientRouter from "./routes/client/index.route";
import adminRouter from "./routes/admin/index.route";

import flash from "express-flash";
import cookieParser from "cookie-parser";
import session  from "express-session";
import methodOverride  from "method-override";

import bodyParser from "body-parser";
import { systemConfig } from "./config/system";
import path from "path";
import moment = require("moment");

systemConfig
dotenv.config(); // enviroment varibales
connect(); // database

// express
const app: Express = express();
const port:(string | number) = process.env.PORT || 3000;

app.use(methodOverride('_method')); //method-override
app.use(express.static('public')); // static files

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// express-flash
app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());

// locals variable
app.locals.path_admin = systemConfig.prefix_admin;
app.locals.moment = moment;
// console.log(moment('2016-01-01T23:35:01').format('MM/DD/YYYY'));

// tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// template engines
app.set('views', './views');
app.set('view engine', 'pug');

clientRouter(app); // client router
adminRouter(app); // admin router

// error router
app.get("*", (req, res) => {
    res.render("client/pages/errors/404", {
      pageTitle: "404 Not Found",
    });
});

// listen port
app.listen(port, () => {
    console.log(`Music App listening`);
});