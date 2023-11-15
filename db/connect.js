import mongoose from 'mongoose';

const connectDB = (uri) => {
    const connectDataBase = mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    console.log("Connected with DB");
    return connectDataBase;
}

export default connectDB