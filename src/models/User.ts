import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import {
	prop as Property,
	getModelForClass,
	pre,
	DocumentType,
} from '@typegoose/typegoose';
import { userRole } from './types';
import {
	comparePassword,
	generateResetToken,
	hashedToken,
	hashPassword,
} from '../utils';

registerEnumType(userRole, { name: 'userRole' });

@pre<User>('save', function (next: any) {
	// ONLY RUN IF PASSWORD IS NOT MODIFIED
	if (!this.isModified('password')) return next();

	// HASH THE PASSWORD
	this.password = hashPassword(this.password);

	next();
})
@ObjectType({ description: 'The User model' })
export class User {
	@Field(() => ID)
	id: string;

	@Field()
	@Property({ required: true, trim: true, unique: true })
	email: string;

	@Field()
	@Property({ required: true, trim: true })
	firstName: string;

	@Field()
	@Property({ trim: true })
	lastName: string;

	@Field()
	@Property({ required: true, trim: true })
	phoneNumber: string;

	@Field({ nullable: true })
	@Property({ required: true, trim: true, select: false })
	password: string;

	@Field()
	@Property()
	passwordChangedAt?: Date;

	@Field()
	@Property()
	passwordResetExpires?: Date;

	@Field()
	@Property()
	passwordResetToken?: string;

	@Field(_type => userRole)
	@Property({ required: false, default: userRole.USER })
	role?: userRole;

	//staticsMethod
	public static correctPassword(
		currentPassword: string,
		hashedPassword: string
	) {
		const isCorrect = comparePassword(currentPassword, hashedPassword);

		return isCorrect;
	}
	//instanceMethod
	public async createPasswordResetToken(this: DocumentType<User>) {
		const resetToken = generateResetToken();

		this.passwordResetToken = hashedToken(resetToken);
		this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

		await this.save({ validateBeforeSave: false });

		return resetToken;
	}
}

export const UserModel = getModelForClass(User, {
	schemaOptions: { timestamps: true },
});
