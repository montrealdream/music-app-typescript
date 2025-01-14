import mongoose from "mongoose";
import slug from "mongoose-slug-updater";
mongoose.plugin(slug);

// create schema
const SongSchema = new mongoose.Schema(
    {
        singerId: String,
        topicId: String,
        title: String,
        description: String,
        lyrics: String,
        audio: String, 
        position: Number,
        avatar: String,
        slug: {
            type: String,
            slug: "title",
            unique: true
        }, // slug phục vụ cho tìm kiếm và SEO
        listen:{
            type: Number,
            default: 0
        }, // lượt nghe, có thể sau này lưu vô collection
        like:{
            type: Number,
            default: 0
        }, // lưu tạm, sau này lưu vô collection khác luôn
        status: String,
        createdBy: {
            account_id: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        },
        updatedBy: [
            {
                account_id: String,
                did: String,
                updatedAt: Date
            }
        ],
        deletedBy: {
            account_id: String,
            deletedAt: {    
                type: Date,
                default: Date
            }
        },
        deleted: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
);


// create model
const Song = mongoose.model('Song', SongSchema, 'songs');

// export
export default Song;