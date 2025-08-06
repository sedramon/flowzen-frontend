import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Article, CreateArticleDto, UpdateArticleDto } from "../../../models/Article";

@Injectable({
    providedIn: 'root'
})
export class ArticlesService {
    private apiUrl = `${environment.apiUrl}`;

    private articlesSubject = new BehaviorSubject<Article[]>([]);
    public $articles = this.articlesSubject.asObservable();

    constructor(private http: HttpClient) {}

    getAllArticles(tenant: string): Observable<Article[]> {
        const params = new HttpParams().set('tenant', tenant);

        return this.http.get<Article[]>(`${this.apiUrl}/articles`, {params}).pipe(
            tap((articles) => {
                this.articlesSubject.next(articles);
            })
        )
    }

    getOneArticleById(id: string): Observable<Article> {
        return this.http.get<Article>(`${this.apiUrl}/articles/${id}`);
    }

    getAllActiveArticles(tenant: string): Observable<Article[]> {
        const params = new HttpParams().set('tenant', tenant);

        return this.http.get<Article[]>(`${this.apiUrl}/articles/active/get`, {params});
    }

    deleteArticle(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/articles/${id}`).pipe(
            tap(() => {
                const filteredArticles = this.articlesSubject.value.filter((article) => article._id !== id)
                this.articlesSubject.next(filteredArticles);
            })
        )
    }

    createArticle(createArticleDto: CreateArticleDto): Observable<Article> {
        return this.http.post<Article>(`${this.apiUrl}/articles`, createArticleDto).pipe(
            tap((newArticle) => {
                const articles = this.articlesSubject.value;
                this.articlesSubject.next([...articles, newArticle]);
            })
        )
    }

    updateArticle(id: string, updateArticleDto: UpdateArticleDto): Observable<Article> {
        return this.http.put<Article>(`${this.apiUrl}/articles/${id}`, updateArticleDto).pipe(
            tap((updatedArticle) => {
                const articles = this.articlesSubject.value.map((article) => article._id === updatedArticle._id ? updatedArticle : article);
                this.articlesSubject.next(articles);
            })
        )
    }
}