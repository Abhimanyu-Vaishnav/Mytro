from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseBadRequest, JsonResponse
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.views.decorators.http import require_POST
import json

from .forms import ProfileForm, PostForm, CommentForm, UserForm, CustomSignupForm
from .models import Post, Like, Comment, Profile, Follow

def signup_view(request):
    if request.method == 'POST':
        form = CustomSignupForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = CustomSignupForm()
    return render(request, 'core/signup.html', {'form': form})

# views.py में profile_view function को replace करें

@login_required
def profile_view(request, username=None):
    # If no username provided, show current user's profile
    if not username:
        username = request.user.username
    
    profile_user = get_object_or_404(User, username=username)
    is_own_profile = (request.user == profile_user)
    
    # Get user's posts
    user_posts = Post.objects.filter(author=profile_user).order_by('-created_at')
    
    # Get follow stats
    followers_count = Follow.objects.filter(following=profile_user).count()
    following_count = Follow.objects.filter(follower=profile_user).count()
    
    # Check if current user follows this profile user
    is_following = False
    if not is_own_profile and request.user.is_authenticated:
        is_following = Follow.objects.filter(
            follower=request.user, 
            following=profile_user
        ).exists()
    
    # Get followers and following lists (limited to 10 each)
    followers = User.objects.filter(
        following__following=profile_user
    )[:10]
    
    following_users = User.objects.filter(
        followers__follower=profile_user
    )[:10]
    
    context = {
        'profile_user': profile_user,  # यहाँ profile_user use करें
        'is_own_profile': is_own_profile,
        'user_posts': user_posts,
        'followers_count': followers_count,
        'following_count': following_count,
        'is_following': is_following,
        'followers': followers,
        'following_users': following_users,
        'posts_count': user_posts.count(),
    }
    
    return render(request, 'core/profile.html', context)

@login_required
def my_profile_view(request):
    return profile_view(request, username=request.user.username)

@login_required
def edit_profile_view(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=user)
        profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile', username=user.username)
    else:
        user_form = UserForm(instance=user)
        profile_form = ProfileForm(instance=profile)
    return render(request, 'core/edit_profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
        'user': user,
    })

@login_required
def feed_view(request):
    # Get users that current user follows
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)

    # Posts from followed users + self
    posts = Post.objects.filter(
        Q(author__in=following_users) | Q(author=request.user)
    ).order_by('-created_at')

    # Suggest users to follow (excluding self and already followed)
    suggestions = User.objects.exclude(
        Q(id=request.user.id) | Q(id__in=following_users)
    ).order_by('?')[:5]

    form = PostForm()
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            new_post = form.save(commit=False)
            new_post.author = request.user
            new_post.save()
            return redirect('feed')

    return render(request, 'core/feed.html', {
        'posts': posts,
        'form': form,
        'suggestions': suggestions,
    })

@login_required
def post_create_view(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect('feed')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = PostForm()
    return render(request, 'core/post_create.html', {'form': form})

@login_required
def follow_user(request, username):
    to_follow = get_object_or_404(User, username=username)
    if to_follow != request.user:
        Follow.objects.get_or_create(follower=request.user, following=to_follow)
    return redirect('profile', username=username)

@login_required
def unfollow_user(request, username):
    to_unfollow = get_object_or_404(User, username=username)
    Follow.objects.filter(follower=request.user, following=to_unfollow).delete()
    return redirect('profile', username=username)

# API VIEWS
@csrf_exempt
@login_required
def edit_post(request, pk):
    if request.method == 'POST':
        try:
            # Check content type
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                content = data.get('content', '').strip()
            else:
                content = request.POST.get('content', '').strip()
            
            if not content:
                return JsonResponse({'error': 'Post content cannot be empty'}, status=400)
            
            # Get post and verify ownership
            post = Post.objects.get(pk=pk, author=request.user)
            post.content = content
            
            # Handle image upload if present
            if 'image' in request.FILES:
                post.image = request.FILES['image']
            
            post.save()
            
            return JsonResponse({
                'success': True,
                'content': post.content,
                'image_url': post.image.url if post.image else None
            })
            
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found or you are not the author'}, status=404)
        except Exception as e:
            print(f"Error in edit_post: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@csrf_exempt
@login_required
def edit_comment(request, pk):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            if not content:
                return JsonResponse({'error': 'Comment cannot be empty'}, status=400)
            
            comment = Comment.objects.get(pk=pk, user=request.user)
            comment.content = content
            comment.save()
            
            return JsonResponse({
                'success': True,
                'content': comment.content
            })
            
        except Comment.DoesNotExist:
            return JsonResponse({'error': 'Comment not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@csrf_exempt
@login_required
def add_comment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            post_id = data.get('post_id')
            comment_text = data.get('comment', '').strip()
            
            if not post_id or not comment_text:
                return JsonResponse({'error': 'Missing fields'}, status=400)
            
            post = Post.objects.get(pk=post_id)
            new_comment = Comment.objects.create(
                user=request.user, 
                post=post, 
                content=comment_text
            )
            
            result = {
                'id': new_comment.id,
                'content': new_comment.content,
                'name': new_comment.user.get_full_name() or new_comment.user.username,
                'photoUrl': new_comment.user.profile.profile_pic.url if hasattr(new_comment.user, 'profile') and new_comment.user.profile.profile_pic else '',
                'profile_url': reverse('profile', args=[new_comment.user.username]),
                'date': new_comment.created_at.strftime('%b %d, %Y %H:%M'),
            }
            return JsonResponse(result)
            
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@csrf_exempt
@login_required
def like_post(request, pk):
    if request.method == 'POST':
        try:
            post = Post.objects.get(pk=pk)
            like_instance = Like.objects.filter(user=request.user, post=post).first()
            
            if like_instance:
                like_instance.delete()
                liked = False
            else:
                Like.objects.create(user=request.user, post=post)
                liked = True
                
            like_count = Like.objects.filter(post=post).count()
            return JsonResponse({
                'like_count': like_count, 
                'liked': liked
            })
            
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def upload_post_photo(request):
    if request.method == 'POST':
        photo = request.FILES.get('photo')
        post_id = request.POST.get('post_id')
        
        if not photo or not post_id:
            return JsonResponse({'error': 'Photo and post_id required'}, status=400)
        
        try:
            post = Post.objects.get(pk=post_id, author=request.user)
            post.image = photo
            post.save()
            return JsonResponse({'photo_url': post.image.url})
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@csrf_exempt
@login_required
def like_comment(request, pk):
    if request.method == 'POST':
        try:
            comment = Comment.objects.get(pk=pk)
            # Since Comment model doesn't have likes field, we'll implement this later
            return JsonResponse({'like_count': 0})
        except Comment.DoesNotExist:
            return JsonResponse({'error': 'Comment not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

# MODERN FEED API VIEWS
@login_required
@require_POST
def create_post(request):
    content = request.POST.get('content', '')
    image = request.FILES.get('image')
    
    if content or image:
        post = Post.objects.create(
            author=request.user,
            content=content,
            image=image
        )
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'post_id': post.id})
        return redirect('feed')
    
    return JsonResponse({'success': False, 'error': 'Content or image required'})

@login_required
@require_POST
def repost_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    # Basic implementation - you can extend this
    return JsonResponse({
        'reposted': True,
        'repost_count': 0
    })

@login_required
@require_POST
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, author=request.user)
    post.delete()
    return JsonResponse({'success': True})

@login_required
@require_POST
def remove_post_image(request, post_id):
    post = get_object_or_404(Post, id=post_id, author=request.user)
    if post.image:
        post.image.delete(save=False)
        post.image = None
        post.save()
    return JsonResponse({'success': True})

@login_required
@require_POST
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id, user=request.user)
    comment.delete()
    return JsonResponse({'success': True})

@login_required
@require_POST
def follow_user_api(request, user_id):
    user_to_follow = get_object_or_404(User, id=user_id)
    
    if user_to_follow != request.user:
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        return JsonResponse({
            'username': user_to_follow.username,
            'following': created
        })
    
    return JsonResponse({'error': 'Cannot follow yourself'}, status=400)

@login_required
def suggested_users(request):
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    
    suggestions = User.objects.exclude(
        Q(id=request.user.id) | Q(id__in=following_users)
    ).order_by('?')[:10]
    
    users_data = []
    for user in suggestions:
        users_data.append({
            'id': user.id,
            'name': user.get_full_name() or user.username,
            'username': user.username,
            'photo': user.profile.profile_pic.url if hasattr(user, 'profile') and user.profile.profile_pic else None
        })
    
    return JsonResponse({'users': users_data})

@login_required
@require_POST
def pin_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, author=request.user)
    # Basic implementation
    return JsonResponse({'success': True})

@login_required
def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all().order_by('created_at')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'name': comment.user.get_full_name() or comment.user.username,
            'profile_url': reverse('profile', args=[comment.user.username]),
            'is_owner': comment.user == request.user,
            'photoUrl': comment.user.profile.profile_pic.url if hasattr(comment.user, 'profile') and comment.user.profile.profile_pic else ''
        })
    
    return JsonResponse({'comments': comments_data})

@login_required
def load_more_posts(request):
    offset = int(request.GET.get('offset', 0))
    limit = 10
    
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    posts = Post.objects.filter(
        Q(author__in=following_users) | Q(author=request.user)
    ).order_by('-created_at')[offset:offset + limit]
    
    posts_data = []
    for post in posts:
        posts_data.append({
            'id': post.id,
            'content': post.content,
            'author': {
                'username': post.author.username,
                'name': post.author.get_full_name() or post.author.username,
                'photo': post.author.profile.profile_pic.url if hasattr(post.author, 'profile') and post.author.profile.profile_pic else None
            },
            'image': post.image.url if post.image else None,
            'likes_count': post.likes.count(),
            'comments_count': post.comments.count(),
            'created_at': post.created_at.strftime('%b %d, %Y')
        })
    
    return JsonResponse({'posts': posts_data})


# views.py में add करें
@login_required
def get_followers(request, username):
    profile_user = get_object_or_404(User, username=username)
    followers = User.objects.filter(following__following=profile_user)
    
    followers_data = []
    for user in followers:
        followers_data.append({
            'id': user.id,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None
        })
    
    return JsonResponse({'followers': followers_data})

@login_required
def get_following(request, username):
    profile_user = get_object_or_404(User, username=username)
    following = User.objects.filter(followers__follower=profile_user)
    
    following_data = []
    for user in following:
        following_data.append({
            'id': user.id,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None
        })
    
    return JsonResponse({'following': following_data})