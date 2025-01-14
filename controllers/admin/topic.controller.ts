import { Response, Request } from "express";

// model 
import Topic from "../../models/topic.model";
import Account from "../../models/account.model";

// interface
import { findTopicInterface, filterStatusInterface, paginationInterface } from "../../config/interface";

// helper
import * as filterHelper from "../../helper/filter.helper";
import * as searchHelper from "../../helper/search.helper";
import {index as paginationHelper} from "../../helper/pagination.helper";

// system config
import { systemConfig } from "../../config/system";
const PATH_ADMIN = systemConfig.prefix_admin;

// [GET] /admin/topics/
export const index = async (req: Request, res: Response) => {
    try{
        const findObjectTopic: findTopicInterface = {
            deleted: false
        };

        // Filter stautus
        const status: string = `${req.query.status}` || "";
        if(req.query.status){    
            findObjectTopic["status"] = status;// không gán biến status vào vì nó sẽ bị tìm theo status = ""
        }
        const filterStatusArray: filterStatusInterface[] = filterHelper.status(req.query);
        // End Filter stautus
        
        // Search keyword
        const keyword: string = req.query.keyword ? `${req.query.keyword}` : undefined;
        const keywordObjectHelper = searchHelper.keywordAdvance(req.query);
        // End Search keyword

        let sizeOfDocuments: number = 0;
        let topics; // contain records get
        let paginationObject; // pagination
        
        // sort citeria
        const sortObject = {};

        if(req.query.sortKey && req.query.sortValue){
            const sortKey: string = `${req.query.sortKey}`;
            const sortValue: string = `${req.query.sortValue}`;

            sortObject[sortKey] = sortValue;
        }
        else {
            sortObject["position"] = "desc";
        }
        // end sort citeria

        if(req.query.keyword){
            sizeOfDocuments = await Topic.countDocuments({
                $or: [
                    {title: keywordObjectHelper.keywordRegexTitle},
                    {slug: keywordObjectHelper.keywordRegexSlug}
                ],
                ...findObjectTopic
            }); // count documents

            // pagination
            paginationObject = paginationHelper(req.query, 5, sizeOfDocuments);
            
            // get database
            const records = await Topic.find({   
                $or: [
                    {title: keywordObjectHelper.keywordRegexTitle},
                    {slug: keywordObjectHelper.keywordRegexSlug}
                ],
                ...findObjectTopic
            }).limit(paginationObject.limit)
            .skip(paginationObject.skip)
            .sort(sortObject);
            
            topics = records;
        }
        
        else {
            sizeOfDocuments = await Topic.countDocuments(findObjectTopic); // count documents

            // pagination
            paginationObject =  paginationHelper(req.query, 5, sizeOfDocuments);

            const records = await Topic.find(findObjectTopic)
                                    .limit(paginationObject.limit)
                                    .skip(paginationObject.skip)
                                    .sort(sortObject); // get database

            topics = records;
        }

        // get user
        for(const topic of topics){
            const createdFullName = await Account.findOne({
                _id: topic.createdBy.account_id,
            }).select("fullName");
            topic["createdFullName"] = createdFullName ? createdFullName.fullName : "Đang cập nhật";

            // get last account to update
            const sizeOfUpdatedBy = topic["updatedBy"].length;
            const lastAccountToUpdate =  topic["updatedBy"][sizeOfUpdatedBy-1];
            if(lastAccountToUpdate){
                const account = await Account.findOne({_id: lastAccountToUpdate.account_id}).select("fullName");
                topic["lastUpdatedBy"] = {
                    fullName: account.fullName,
                    did: lastAccountToUpdate.did,
                    updatedAt: lastAccountToUpdate.updatedAt
                }
            }
            else {
                topic["lastUpdatedBy"] = {
                    fullName: "Đang cập nhật",
                    did: "Đang cập nhật",
                    updatedAt: topic.createdAt
                }
            }
            // if(sizeOfUpdatedBy> 0){
            //     for(const item of topic["updatedBy"]){
            //         const updatedAccount = await Account.findOne({_id: item.account_id}).select("fullName");
            //         item["updatedBy"] = {
            //             fullName: updatedAccount.fullName,
            //             did: item.did,
            //             updatedAt: item.updatedAt
            //         } 
            //     }
            // }
           
            // topic["updatedLastBy"] = {
            //     fullName: "Đang cập nhật",
            //     did: "Đang cập nhật"
            // }
        }
        // end get user

        res.render('admin/pages/topics/index', {
            title: "Quản lý chủ đề bài hát",
            topics,
            filterStatusArray,
            keyword,
            sizeOfDocuments,
            paginationObject

        })
    }
    catch(error){
        console.log(error);
    }
}

// [PATCH] /admin/topics/change-status/:status/:topicID
export const changeStatus = async (req: Request, res: Response) => {
    try{
        const topicID: string = req.params.topicID;
        const status: string  = req.params.status;

        await Topic.updateOne(
            {
                _id: topicID,
                deleted: false
            },{
                status: status,
                $push: {
                    updatedBy: {
                        account_id: res.locals.user._id,
                        did: "Thay đổi trạng thái chủ đề",
                        updatedAt: Date.now()
                    }
                }   
            }
        );

        res.json({
            code: 200,
            id: topicID,
            status
        })
    }
    catch(error){

    }
}

// [PATCH] /admin/topics/change-multi
export const changeMulti = async (req: Request, res: Response) => {
    try{
        const type: string = req.body.type;
        const listID: string[] = (req.body.ids).split(", ");
        switch(type){
            case "active":
                await Topic.updateMany(
                    {
                        _id: {$in : listID}
                    },
                    {
                        status: "active",
                        $push: {
                            updatedBy: {
                                account_id: res.locals.user._id,
                                did: "Thay đổi trạng thái chủ đề",
                                updatedAt: Date.now()
                            }
                        }   
                    }
                );
                break;
            
            case "inactive":
                await Topic.updateMany(
                    {
                        _id: {$in : listID}
                    },
                    {
                        status: "inactive",
                        $push: {
                            updatedBy: {
                                account_id: res.locals.user._id,
                                did: "Thay đổi trạng thái chủ đề",
                                updatedAt: Date.now()
                            }
                        }   
                    }
                );
            case "position":
                for(const item of listID){
                    const [id, position] = item.split("-");
                    await Topic.updateOne(
                        {_id: id},
                        {
                            position: position,
                            $push: {
                                updatedBy: {
                                    account_id: res.locals.user._id,
                                    did: "Thay đổi vị trí chủ đề",
                                    updatedAt: Date.now()
                                }
                            }   
                        }
                    );
                }
                break;
            case "delete":
                await Topic.updateMany(
                    {
                        _id: {$in : listID}
                    },
                    {
                        status: "inactive",
                        deleted: true,
                    }
                );
                break;
            default: 
                break;
        }
        
        res.redirect('back');
    }
    catch(error){

    }
}

// [PATCH] /admin/topics/delete-soft/:topicID
export const deleteSoft = async (req: Request, res: Response) => {
    try{
        const topicID: string = req.params.topicID;
        
        await Topic.updateOne(
            {_id: topicID},
            {
                status: "inactive",
                deleted: true,
                deletedBy: {
                    account_id: res.locals.user._id,
                    deletedAt: Date.now()
                }
            }
        );

        res.status(200).json({
            code: 200,
        })
    }
    catch(error){

    }
}

// [PATCH] /admin/topics/trash
export const trashUI = async (req: Request, res: Response) => {
    try{
        const findObjectTopic: findTopicInterface = {
            deleted: true
        };
        const topics = await Topic.find(findObjectTopic);

        // get user
        for(const topic of topics){
            const deletedFullName = await Account.findOne({
                _id: topic.deletedBy.account_id,
            }).select("fullName");
            topic["deletedFullName"] = deletedFullName ? deletedFullName.fullName : "Đang cập nhật";
        }

        res.render("admin/pages/topics/trash",{
            title: "Chủ đề đã xóa",
            topics
        })
    }
    catch(error){
        console.log(error);
    }
}

// [PATCH] /admin/topics/restore/:topicID
export const restore = async (req: Request, res: Response) => {
    try{
        const topicID = req.params.topicID;
        await Topic.updateOne(
            {_id: topicID},
            {
                deleted: false,
                $push: {
                    updatedBy: {
                        account_id: res.locals.user._id,
                        did: "Khôi phục chủ đề đã xóa",
                        updatedAt: Date.now()
                    }
                }   
            }
        );
        res.status(200).json({
            code: 200
        });
    }
    catch(error){
        console.log(error);
    }
}

// [GET] /admin/topics/create
export const createUI = async (req: Request, res: Response) => {
    try{
        res.render("admin/pages/topics/create", {
            title: "Tạo chủ đề mới"
        });
    }
    catch(error){
        console.log(error);
    }
}

// [POST] /admin/topics/create
export const create = async (req: Request, res: Response) => {
    try{
        const findObjectTopic: findTopicInterface = {
            status: "active",
            deleted: false
        };

        const sizeOfDocuments = await Topic.countDocuments(findObjectTopic); // count document

        if(req.body.position === ""){
            req.body["position"] = sizeOfDocuments + 1;  
        }

        req.body["createdBy"] = {
            account_id: res.locals.user._id
        };

        const record = new Topic(req.body);
        await record.save();
        res.redirect(PATH_ADMIN + '/topics');
    }
    catch(error){
        console.log(error);
    }
}

// [GET] /admin/topics/edit/:topicID
export const editUI = async (req: Request, res: Response) => {
    try{
        const topicID: string = req.params.topicID;
        const topic = await Topic.findOne({
            _id: topicID,
        });
        
        res.render("admin/pages/topics/edit", {
            title: "Chỉnh sửa chủ đề",
            topic
        })
    }
    catch(error){

    }
}

// [PATCH] /admin/topics/edit/:topicID
export const edit = async (req: Request, res: Response) => {
    try{
        const topicID: string = req.params.topicID;
        await Topic.updateOne(
            {_id: topicID},
            req.body
        );
        res.redirect('back');
    }
    catch(error){

    }
}

// [GET] /admin/topics/edit/:topicID
export const detailUI = async (req: Request, res: Response) => {
    try{
        const topicID: string = req.params.topicID;
        const topic = await Topic.findOne({ _id: topicID });
        res.render("admin/pages/topics/detail", {
            title: "Chi tiết chủ đề",
            topic
        })
    }
    catch(error){

    }
}