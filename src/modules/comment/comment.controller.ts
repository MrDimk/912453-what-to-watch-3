import {Controller} from '../../common/controller/controller.js';
import {inject, injectable} from 'inversify';
import {Component} from '../../types/component.types.js';
import {LoggerInterface} from '../../common/logger/logger.interface.js';
import {HttpMethod} from '../../types/http-method.enum.js';
import {Request, Response} from 'express';
import {MovieServiceInterface} from '../movie/movie-service.interface.js';
import {CommentServiceInterface} from './comment-service.interface.js';
import {HttpError} from '../../common/errors/http-error.js';
import {StatusCodes} from 'http-status-codes';
import {CommentResponse} from './response/comment.response.js';
import {fillDTO} from '../../utils/common.js';

@injectable()
export class CommentController extends Controller {
  constructor(
    @inject(Component.LoggerInterface) logger: LoggerInterface,
    @inject(Component.CommentServiceInterface) private commentService: CommentServiceInterface,
    @inject(Component.MovieServiceInterface) private movieServise: MovieServiceInterface
  ) {
    super(logger);

    this.logger.info('Register routes for CommentController…');

    this.addRoute({path: '/', method: HttpMethod.Post, handler: this.createComment});
    this.addRoute({path: '/:movieId', method: HttpMethod.Get, handler: this.getMovieComments});
  }

  public async createComment(req: Request, res: Response): Promise<void> {
    const { body } = req;
    const movie = await this.movieServise.findByMovieId(body.movieId);
    if (!movie) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Movie with id ${body.movieId} don't exist.`,
        'CommentController'
      );
    }

    const comment = await this.commentService.create(body);
    await this.movieServise.incCommentCount(body.movieId);
    await this.movieServise.calcAndUpdateRating(body.movieId);
    console.log(comment);
    this.created(res, fillDTO(CommentResponse, comment));

    this.logger.warn('Comment created in testing mode, handler is not implemented yet!');
  }

  public async getMovieComments(req: Request, res: Response): Promise<void> {
    const {movieId} = req.params;
    const movie = this.movieServise.findByMovieId(movieId);
    if(!movie) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        `Movie with id ${movieId} don't exist.`,
        'CommentController'
      );
    }

    const result = await this.commentService.findByMovieId(movieId);
    this.ok(res, fillDTO(CommentResponse, result));
  }
}
