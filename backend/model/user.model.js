import { Schema } from 'mongoose';
import validator from 'validator';
import { connection } from '../database/databaseConfig';

const addressSchema = new Schema({
    street: {
        type: String,
        trim: true,
        maxlength: [100, "Street can be at most 100 characters long"],
    },
    city: {
        type: String,
        trim: true,
        maxlength: [50, "City can be at most 50 characters long"],
    },
    state: {
        type: String,
        trim: true,
        maxlength: [50, "State can be at most 50 characters long"],
    },
    pinCode: {
        type: String,
        trim: true,
        maxlength: [10, "Pin code can be at most 10 characters long"],
    },
    country: {
        type: String,
        trim: true,
        maxlength: [50, "Country can be at most 50 characters long"],
    },
},
    { _id: false });

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [70, "Name can be at most 70 characters long"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"],
        trim: true,
        lowercase: true,
        minlength: [5, "Email must be at least 5 characters long"],
        maxlength: [255, "Email can be at most 255 characters long"],
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: "Please enter a valid email address!!"
        },
    },
    password: {
        type: String,
        select: false,
        trim: true,
        validate: {
            validator: function (value) {
                return validator.isStrongPassword(value, {
                    minLength: 8,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1,
                });
            },
            message:
                'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
        },
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v); // +91-9876543210 or 9876543210
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        maxlength: 15,
        minlength: 10
    },
    website: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        },
        maxlength: 2048,
    },
    profileImageUrl: {
        type: String,
        default: function () {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
        }
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: [100, "Company name can be at most 100 characters long"],
    },
    GSTNumber: {
        type: String,
        trim: true,
        maxlength: [15, "GST Number can be at most 15 characters long"],
    },
    address: addressSchema,
    timezone: {
        type: String,
        trim: true,
        maxlength: [50, "Timezone can be at most 50 characters long"],
    },
    language: {
        type: String,
        trim: true,
        maxlength: [50, "Language can be at most 50 characters long"],
    },
    subscriptionPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
    },
}, { timestamps: true });

userSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
        return next();
    } catch (err) {
        return next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = connection.model('User', userSchema);

export default User;
