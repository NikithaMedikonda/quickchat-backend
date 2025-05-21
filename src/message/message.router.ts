import express from 'express'
import { authenticateToken } from '../user/user.middleware'
import { postMessage, updateMessageStatus } from './message.controller'

export const messageRouter = express.Router();

messageRouter.post('/api/message/',authenticateToken, postMessage);
messageRouter.put('/api/messages/status', authenticateToken, updateMessageStatus);
