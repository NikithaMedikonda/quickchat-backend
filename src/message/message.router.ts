import express from 'express'
import { authenticateToken } from '../user/user.middleware'
import { postMessage } from './message.controller'

export const messageRouter = express.Router();

messageRouter.post('/api/message/',authenticateToken, postMessage);
