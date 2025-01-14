// instance Response & Request 
import { Request, Response } from "express";
import bcrypt  from "bcrypt";

// models
import User from "../../models/user.model";
import ForgotPassword from "../../models/forgot-password.model";

// helper
import * as generateHelper from "../../helper/generate.helper";
import { sendMail } from "../../helper/mail.helper";

// define
const saltRounds: number = 10; // Typically a value between 10 and 12 brcypt
// [GET] /user/register
export const registerUI = async (req: Request, res: Response) => {
    try{
        res.render("client/pages/user/register", {
            title: "Đăng ký tài khoản"
        });
    }
    catch(error){

    }
}

// [POST] /user/register
export const register = async (req: Request, res: Response) => {
    try{
        // is email exist ?
        const user = await User.findOne({
            email: req.body.email,
            deleted: false
        });

        if(user){
            // ...thông báo flash
            return;
        }

        // hashing password
        const password: string = req.body.password; 
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
                // Handle error
                return;
            }

            // Hashing successful, 'hash' contains the hashed password
            const record = new User({
                fullName: req.body.fullName,
                email: req.body.email,
                password: hash,
                tokenUser: generateHelper.randomString(20)
            });

            // save on database
            await record.save();
        });
        res.redirect('/user/login');
    }
    catch(error){
        console.log(error);
    }
}

// [GET] /user/login
export const loginUI = async (req: Request, res: Response) => {
    try{
        res.render('client/pages/user/login', {
            title: "Đăng nhập"
        });
    }
    catch(error){

    }
}

// [POST] /user/login
export const login = async (req: Request, res: Response) => {
    try{
        // is email exits ?
        const user = await User.findOne({
            email: req.body.email,
            deleted: false
        });

        if(!user){
            // ...thông báo email không tồn tại
            res.redirect('back');
            return;
        }

        // is user active ?
        if(user.status != "active"){
            // ...thông báo tài khoản đã dừng hoạt động
            res.redirect('back');
            return;
        }

        // compare(verify) password
        const passwordLogin: string = req.body.password;
        bcrypt.compare(passwordLogin, user.password, (err, result) => {
            if (err) {
                // Handle error
                console.error('Error comparing passwords:', err);
                return;
            }
        
            if(result) {
                // Passwords match, authentication successful
                console.log('Passwords match! User authenticated.');

                // set cookie
                res.cookie('tokenUser', user.tokenUser, {
                    maxAge: 1000 * 60 * 60, //expire cookie: 1h 
                    httpOnly: true
                });
                
                res.redirect('/topics');
            } 
            else {
                // Passwords don't match, authentication failed
                console.log('Passwords do not match! Authentication failed.');
                // ...thông báo mật khẩu không chính xác
            }
        });
        
    }
    catch(error){

    }
}

// [GET] /user/logout
export const logout = async (req: Request, res: Response) => {
    try{
        // clear cookies
        res.clearCookie('tokenUser');

        res.redirect('/topics');
    }
    catch(error){

    }
}

// [GET] /user/password/forgot
export const forgotPasswordUI = async (req: Request, res: Response) => {
    try{
        res.render('client/pages/user/forgot-password', {
            title: "Quên mật khẩu"
        })
    }
    catch(error){

    }
}

// [POST] /user/password/forgot
export const forgotPassword = async (req: Request, res: Response) => {
    try{
        // email is valid ?
        const user = await User.findOne({
            email: req.body.email,
            status: "active",
            deleted: false
        }).select("-password");

        if(!user){
            // ...thông báo email không hợp lệ
            res.redirect('back');
            return;
        }

        // STEP 1: CREATE OBJECT OTP & SAVE ON DB
        const otp: string = generateHelper.randomStrNumber(6);

        const record = new ForgotPassword({
            email: req.body.email,
            otp: otp,
            expireAt: Date.now() + (1000*60*3) // 3m
        });
        await record.save();

        // STEP 2: SEND OTP THROUGH MAIL 
        const toEmail: string = req.body.email;
        const subject: string = `Thiết lập lại mật khẩu `;
        const html: string = `
            <div>
                Ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản sau:
            </div><br>
            
            <div>
                <b>Tên trang web:</b> SoundLound Intelligence
            </div><br>

            <div>
                <b>Email:</b> ${toEmail}
            </div><br>

            <div>
                Nếu đây chỉ là sự nhầm lẫn, chỉ cần bỏ qua email này
            </div><br>

            <div>
                <b>Mã OTP</b>: ${otp} <br>

                <h3>
                    <b>Lưu ý mã chỉ có hiệu lực trong 3 phút</b>
                </h3>
            </div>

        `;
        sendMail(toEmail, subject, html);

        res.redirect(`/user/password/otp?email=${toEmail}`);
    }
    catch(error){
        console.log(error);
    }
}

// [GET] /user/password/otp
export const otpUI = async (req: Request, res: Response) => {
    try{
        res.render('client/pages/user/otp-password', {
            title: "Nhập mã OTP",
            email: req.query.email
        });
    }
    catch(error){

    }
}

// [POST] /user/password/otp
export const otp = async (req: Request, res: Response) => {
    try{
        // email is valid ?
        const user = await User.findOne({
            email: req.body.email,
            deleted: false
        });

        if(!user){
            // ...thông báo email không hợp lệ
            res.redirect('/user/password/forgot');
            return;
        }

        // is user active
        if(user.status === "inactive"){
            // ...thông báo tài khoản đã bị khóa
            res.redirect('/user/password/forgot');
            return;
        }

        // check otp
        const isValidOTP = await ForgotPassword.findOne({
            email: req.body.email,
            otp: req.body.otp
        });

        if(!isValidOTP){
            // ...thông báo OTP không hợp lệ
            res.redirect('/user/password/forgot');
            return;
        }
        
        // cookie này phục vụ cho việc đổi mật khẩu mới, nhìn zậy chứ chưa bảo mật lắm
        res.cookie('token_user_otp', user.tokenUser);

        // clear otp on database
        await ForgotPassword.deleteOne({
            email: req.body.email,
            otp: req.body.otp
        });

        res.redirect('/user/password/reset');
    }
    catch(error){

    }
}

// [GET] /user/password/reset
export const resetPasswordUI = async (req: Request, res: Response) => {
    try{
        res.render('client/pages/user/reset-password', {
            title: "Reset Mật Khẩu"
        });
    }
    catch(error){

    }
}

// [POST] /user/password/reset
export const resetPassword= async (req: Request, res: Response) => {
    try{
        const password: string = req.body.password;
        const tokenUserOtp: string = req.cookies.token_user_otp;
        console.log(password, tokenUserOtp);
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
                // Handle error
                return;
            }
        
            // Hashing successful, 'hash' contains the hashed password
            // ...thông báo đổi mật khẩu thành công
            await User.updateOne(
                {
                    tokenUser: tokenUserOtp,
                    status: "active",
                    deleted: false
                },{
                    password: hash
                }
            );
        });

        // clear cookies otp
        res.clearCookie('token_user_otp');
        res.redirect(`/user/login`);
        
    }
    catch(error){

    }
}