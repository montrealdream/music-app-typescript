import { Response, Request, NextFunction } from "express";

// [POST] /user/register
export const register = (req: Request, res: Response, next: NextFunction) =>{
    if(!req.body.fullName){
        // ...thông báo flash
        res.redirect('back');
        return;
    }

    if(!req.body.email){
        // ...thông báo flash
        res.redirect('back');
        return;
    }

    if(!req.body.password){
        // ...thông báo flash
        res.redirect('back');
        return;
    }

    // next middleware
    next();
}

// [POST] /user/login
export const login = (req: Request, res: Response, next: NextFunction) => {
    if(!req.body.email){
        // ...thông báo flash
        res.redirect('back');
        return;
    }

    if(!req.body.password){
        // ...thông báo flash
        res.redirect('back');
        return;
    }

    // next middleware
    next();
}

// [POST] /user/password/forgot
export const forgotPassword = (req: Request, res: Response, next: NextFunction) => {
    if(!req.body.email){
        // ...thông báo nhập email
        res.redirect('back');
        return;
    }
    // next middleware
    next();
}

// [POST] /user/password/otp
export const otp = (req: Request, res: Response, next: NextFunction) => {
    if(!req.body.email){
        // ...thông báo không có email
        res.redirect('back');
        return;
    }

    if(!req.body.otp){
        // ...thông báo không có otp
        res.redirect('back');
        return;
    }

    // next middlware
    next();
}

// [POST] /user/password/reset
export const resetPassword = (req: Request, res: Response, next: NextFunction) => {
    if(!req.body.password){
        // ...thông báo điền đầy đủ thông tin
        res.redirect('back');
        return;
    }

    if(!req.body.confirmPassword){
        // ...thông báo xác nhận lại mật khẩu
        res.redirect('back');
        return;
    }

    if(req.body.password != req.body.confirmPassword){
        // ...thông báo 2 mật khẩu trong trùng khớp
        res.redirect('back');
        return;
    }
    
    // next middleware
    next();
}