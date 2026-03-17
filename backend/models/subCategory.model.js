const mongoose = require("mongoose");
const { Schema } = mongoose;

const subCategorySchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "SubCategory name is required"],
			trim: true,
		},
		description: {
			type: String,
		},
		category: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: [true, "SubCategory must belong to a category"],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("SubCategory", subCategorySchema);
