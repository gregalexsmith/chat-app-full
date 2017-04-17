import _ from 'lodash';
import {Validator} from "../validator";

export let MESSAGE_TYPES = ["normal"];

// client and server basic validation for chat messages
export function validateSendMessage(user, message, type) {
	const validator = new Validator();

	if (message.length >= 50)
		validator.error("Message must be less than 50 characters");

  if (message.trim().length === 0)
		validator.error("Message cannot be empty");

	if (!_.includes(MESSAGE_TYPES, type))
		validator.error(`Invalide message type ${type}`);

	return validator;
}
