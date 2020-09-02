/**
 * Required External Modules
 */
import express from "express";
import path from "path"
import cors from "cors";
import helmet from "helmet";
import * as dotenv from "dotenv";
import * as pug from 'pug';
import {connectDB} from './config/db';
import {userRoutes} from './routes/user'
import {router} from './routes/index'

/**
 * Load Config
 */

dotenv.config({path: __dirname+ '/config/.env'});

connectDB()

if (!process.env.PORT) {
    process.exit(1);
 }
 
 const PORT: number = parseInt(process.env.PORT as string, 10);
 const app = express();
/**
 *  App Configuration
 */

//maybe add helmet
app.use(cors());
app.use(express.json());
app.set('view engine', 'pug');

//Static folder
app.use(express.static(path.join(__dirname + '/public')));

//Views folder
app.set('views',path.join(__dirname + '/views'))

/**
 * Server Activation
 */
const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });

//Routes
app.use('/', router)
app.use('/user',userRoutes)


//TODOOOO
//PUT .ENV IN GITIGNORE.





