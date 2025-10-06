from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.utils import timezone
from datetime import timedelta
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import update_session_auth_hash
import json

from .forms import ProfileForm, PostForm, CommentForm, UserForm, CustomSignupForm
from .models import Post, Like, Comment, Profile, Follow, Conversation, ConversationMessage

# ==================== AUTHENTICATION & BASIC VIEWS ====================

def signup_view(request):
    """User registration view"""
    if request.method == 'POST':
        form = CustomSignupForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            return redirect('login')
    else:
        form = CustomSignupForm()
    return render(request, 'core/signup.html', {'form': form})

@login_required
def home_view(request):
    """Home page - redirect to feed"""
    return redirect('feed')

# ==================== PROFILE VIEWS ====================

@login_required
def profile_view(request, username=None):
    """View user profile"""
    if not username:
        return redirect('my_profile')
    
    profile_user = get_object_or_404(User, username=username)
    is_own_profile = (request.user == profile_user)
    
    # Ensure profile exists
    profile, created = Profile.objects.get_or_create(user=profile_user)
    
    # Get user's posts
    user_posts = Post.objects.filter(author=profile_user).order_by('-created_at')
    
    # Get follow stats
    followers_count = Follow.objects.filter(following=profile_user).count()
    following_count = Follow.objects.filter(follower=profile_user).count()
    
    # Check if current user follows this profile user
    is_following = False
    if not is_own_profile:
        is_following = Follow.objects.filter(
            follower=request.user, 
            following=profile_user
        ).exists()
    
    context = {
        'profile_user': profile_user,
        'is_own_profile': is_own_profile,
        'user_posts': user_posts,
        'followers_count': followers_count,
        'following_count': following_count,
        'is_following': is_following,
        'posts_count': user_posts.count(),
    }
    
    return render(request, 'core/profile.html', context)

@login_required
def my_profile_view(request):
    """View current user's profile"""
    return profile_view(request, username=request.user.username)

@login_required
def edit_profile_view(request):
    """Edit profile page and handle form submissions"""
    if request.method == 'POST':
        user = request.user
        # Ensure profile exists
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Handle basic user data
        user.first_name = request.POST.get('first_name', '')
        user.last_name = request.POST.get('last_name', '')
        
        # Handle username change
        new_username = request.POST.get('username', '').strip().lower()
        if new_username and new_username != user.username:
            if not User.objects.filter(username__iexact=new_username).exclude(id=user.id).exists():
                user.username = new_username
        
        user.save()
        
        # Handle profile data
        profile.bio = request.POST.get('bio', '')
        profile.gender = request.POST.get('gender', '')
        profile.website = request.POST.get('website', '')
        profile.phone_number = request.POST.get('phone_number', '')
        profile.work = request.POST.get('work', '')
        profile.education = request.POST.get('education', '')
        profile.relationship_status = request.POST.get('relationship_status', '')
        profile.hometown = request.POST.get('hometown', '')
        profile.current_city = request.POST.get('current_city', '')
        profile.languages_known = request.POST.get('languages_known', '')
        
        # Handle date of birth
        dob = request.POST.get('dob')
        if dob:
            from datetime import datetime
            try:
                profile.dob = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        # Handle file uploads
        if 'profile_pic' in request.FILES:
            profile.profile_pic = request.FILES['profile_pic']
                
        if 'cover_pic' in request.FILES:
            profile.cover_pic = request.FILES['cover_pic']
            
        # Handle cropped image data
        try:
            if 'profile_pic_data' in request.POST:
                import base64
                from django.core.files.base import ContentFile
                image_data = request.POST['profile_pic_data']
                if image_data.startswith('data:image/'):
                    format, imgstr = image_data.split(';base64,')
                    ext = format.split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name=f'profile_{user.id}.{ext}')
                    profile.profile_pic = data
                
            if 'cover_pic_data' in request.POST:
                import base64
                from django.core.files.base import ContentFile
                image_data = request.POST['cover_pic_data']
                if image_data.startswith('data:image/'):
                    format, imgstr = image_data.split(';base64,')
                    ext = format.split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name=f'cover_{user.id}.{ext}')
                    profile.cover_pic = data
        except Exception as e:
            print(f'Error processing image data: {e}')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'profile_pic_data' in request.POST or 'cover_pic_data' in request.POST:
                return JsonResponse({'success': False, 'message': 'Error processing image data'})
            return redirect('profile', username=user.username)
            
        # Handle removals
        if request.POST.get('remove_avatar'):
            if profile.profile_pic:
                profile.profile_pic.delete()
                profile.profile_pic = None
        if request.POST.get('remove_cover'):
            if profile.cover_pic:
                profile.cover_pic.delete()
                profile.cover_pic = None
                
        profile.save()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'profile_pic_data' in request.POST or 'cover_pic_data' in request.POST:
            return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
        return redirect('profile', username=user.username)
    
    # Ensure profile exists for GET request too
    profile, created = Profile.objects.get_or_create(user=request.user)
    return render(request, 'core/edit_profile_modern.html', {
        'user': request.user,
        'profile': profile
    })

# ==================== FEED & POST VIEWS ====================

@login_required
def feed_view(request):
    """Main feed with posts from followed users"""
    try:
        # Ensure user has a profile
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        # Get users that current user follows
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Posts from followed users + own posts
        posts = Post.objects.filter(
            Q(author__in=following_users) | Q(author=request.user)
        ).select_related('author').prefetch_related('likes', 'comments').order_by('-created_at')
        
        # User suggestions
        suggestions = User.objects.exclude(
            Q(id=request.user.id) | Q(id__in=following_users)
        ).order_by('?')[:5]
        
        form = PostForm()
        
        context = {
            'posts': posts,
            'form': form,
            'suggestions': suggestions,
        }
        
        return render(request, 'core/feed.html', context)
    except Exception as e:
        # Debug: Return error details
        from django.http import HttpResponse
        return HttpResponse(f"Feed Error: {str(e)}<br>User: {request.user}<br>Authenticated: {request.user.is_authenticated}")

# @login_required
# @require_http_methods(["GET", "POST"])
# def create_post_view(request):
#     """Create new post"""
#     if request.method == 'POST':
#         from datetime import timedelta
#         import json
        
#         content = request.POST.get('content', '').strip()
#         post_type = request.POST.get('post_type', 'text')
        
#         # Create post
#         post = Post.objects.create(
#             author=request.user,
#             content=content,
#             post_type=post_type
#         )
        
#         # Handle media
#         if 'image' in request.FILES:
#             post.image = request.FILES['image']
#         if 'video' in request.FILES:
#             post.video = request.FILES['video']
        
#         # Handle poll
#         if post_type == 'poll':
#             poll_options = request.POST.get('poll_options')
#             if poll_options:
#                 try:
#                     options = json.loads(poll_options)
#                     post.poll_options = options
#                     post.poll_multiple_choice = request.POST.get('poll_multiple_choice') == 'true'
                    
#                     # Set poll end date
#                     duration_days = int(request.POST.get('poll_duration', 7))
#                     post.poll_end_date = timezone.now() + timedelta(days=duration_days)
#                 except (json.JSONDecodeError, ValueError):
#                     pass
        
#         # Handle location
#         location_data = request.POST.get('location')
#         if location_data:
#             try:
#                 location = json.loads(location_data)
#                 post.location = location.get('address', '')
#             except json.JSONDecodeError:
#                 pass
        
#         post.save()
        
#         if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
#             return JsonResponse({
#                 'success': True,
#                 'post_id': post.id,
#                 'message': 'Post created successfully!'
#             })
#         return redirect('feed')
    
#     return render(request, 'core/post_create.html', {})

@login_required
@require_http_methods(["GET", "POST"])
def create_post_view(request):
    """Create new post"""
    if request.method == 'POST':
        from datetime import timedelta
        import json
        
        content = request.POST.get('content', '').strip()
        post_type = request.POST.get('post_type', 'text')
        
        # Create post
        post = Post.objects.create(
            author=request.user,
            content=content,
            post_type=post_type
        )
        
        # Handle multiple images
        images = request.FILES.getlist('image')
        if images:
            # Save first image to post.image field
            post.image = images[0]
            # You might want to handle multiple images differently
            # depending on your model structure
        
        # Handle poll
        if post_type == 'poll':
            poll_options = request.POST.get('poll_options')
            if poll_options:
                try:
                    options = json.loads(poll_options)
                    post.poll_options = options
                    post.poll_multiple_choice = request.POST.get('poll_multiple_choice', 'false') == 'true'
                    
                    # Set poll end date
                    duration_days = int(request.POST.get('poll_duration', 7))
                    post.poll_end_date = timezone.now() + timedelta(days=duration_days)
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error parsing poll options: {e}")
        
        # Handle location
        location_data = request.POST.get('location')
        if location_data:
            try:
                location = json.loads(location_data)
                post.location = location.get('address', '')
            except json.JSONDecodeError as e:
                print(f"Error parsing location: {e}")
        
        post.save()
        
        # Return consistent JSON response
        return JsonResponse({
            'success': True,
            'post_id': post.id,
            'message': 'Post created successfully!'
        })
    
    # For GET requests, you might want to return the modal HTML
    # or redirect to feed if accessed directly
    return redirect('feed')



@login_required
@require_POST
def delete_post(request, post_id):
    """Delete a post"""
    post = get_object_or_404(Post, id=post_id, author=request.user)
    post.delete()
    return JsonResponse({'success': True, 'message': 'Post deleted successfully'})

@login_required
def post_detail(request, post_id):
    """Post detail view"""
    post = get_object_or_404(Post, id=post_id)
    return render(request, 'core/post_detail.html', {'post': post})

@login_required
def edit_post(request, post_id):
    """Edit post view"""
    post = get_object_or_404(Post, id=post_id, author=request.user)
    
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            updated_post = form.save()
            
            # Return JSON for AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'application/json' in request.headers.get('Accept', ''):
                return JsonResponse({
                    'success': True,
                    'content': updated_post.content,
                    'image_url': updated_post.image.url if updated_post.image else None,
                    'message': 'Post updated successfully'
                })
            
            return redirect('feed')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                }, status=400)
    else:
        form = PostForm(instance=post)
    
    return render(request, 'core/edit_post.html', {'form': form, 'post': post})


def unread_persons_count(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required'})
    
    try:
        # Get conversations where user has unread messages
        unread_conversations = Conversation.objects.filter(
            Q(user1=request.user) | Q(user2=request.user),
            messages__is_read=False,
            messages__sender__ne=request.user
        ).distinct()
        
        # Count unique persons with unread messages
        unread_persons_count = unread_conversations.count()
        
        return JsonResponse({
            'success': True,
            'unread_persons_count': unread_persons_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

# ==================== LIKE SYSTEM ====================

@login_required
@require_POST
def like_post(request, post_id):
    """Like/unlike a post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            like.delete()
            liked = False
            # Remove notification if exists
            from .models import Notification
            Notification.objects.filter(
                sender=request.user,
                recipient=post.author,
                target_post=post,
                notification_type='like'
            ).delete()
        else:
            liked = True
            # Create notification if not liking own post
            if post.author != request.user:
                from .models import Notification
                Notification.objects.get_or_create(
                    sender=request.user,
                    recipient=post.author,
                    target_post=post,
                    notification_type='like',
                    verb=f'liked your post'
                )
        
        like_count = post.likes.count()
        
        return JsonResponse({
            'success': True,
            'liked': liked,
            'like_count': like_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_post_like_status(request, post_id):
    """Get like status for a specific post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        is_liked = post.likes.filter(user=request.user).exists()
        like_count = post.likes.count()
        
        return JsonResponse({
            'success': True,
            'is_liked': is_liked,
            'like_count': like_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_liked_users(request, post_id):
    """Get users who liked a post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        likes = post.likes.select_related('user', 'user__profile')[:20]
        
        liked_users = []
        for like in likes:
            liked_users.append({
                'id': like.user.id,
                'username': like.user.username,
                'name': like.user.profile.full_name,
                'avatar': like.user.profile.profile_pic.url if like.user.profile.profile_pic else None
            })
        
        return JsonResponse({
            'success': True,
            'liked_users': liked_users,
            'total_likes': post.likes.count()
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== COMMENT SYSTEM ====================

@login_required
@require_POST
def add_comment(request):
    """Add comment to a post"""
    try:
        data = json.loads(request.body)
        post_id = data.get('post_id')
        comment_text = data.get('comment', '').strip()
        
        if not post_id or not comment_text:
            return JsonResponse({
                'success': False,
                'error': 'Post ID and comment text are required'
            }, status=400)
        
        post = get_object_or_404(Post, id=post_id)
        comment = Comment.objects.create(
            user=request.user,
            post=post,
            content=comment_text
        )
        
        response_data = {
            'success': True,
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'user': {
                    'username': comment.user.username,
                    'name': comment.user.profile.full_name,
                    'avatar': comment.user.profile.profile_pic.url if comment.user.profile.profile_pic else None
                },
                'created_at': comment.created_at.strftime('%b %d, %Y %H:%M'),
                'is_owner': True
            }
        }
        
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_comments(request, post_id):
    """Get comments for a post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        comments = post.comments.select_related('user', 'user__profile').order_by('created_at')
        
        comments_data = []
        for comment in comments:
            comments_data.append({
                'id': comment.id,
                'content': comment.content,
                'user': {
                    'username': comment.user.username,
                    'name': comment.user.profile.full_name,
                    'avatar': comment.user.profile.profile_pic.url if comment.user.profile.profile_pic else None
                },
                'created_at': comment.created_at.strftime('%b %d, %Y %H:%M'),
                'is_owner': comment.user == request.user
            })
        
        return JsonResponse({
            'success': True,
            'comments': comments_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def delete_comment(request, comment_id):
    """Delete a comment"""
    try:
        comment = get_object_or_404(Comment, id=comment_id, user=request.user)
        comment.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Comment deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def edit_comment(request, comment_id):
    """Edit a comment"""
    try:
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        
        if not content:
            return JsonResponse({
                'success': False,
                'error': 'Comment content cannot be empty'
            }, status=400)
        
        comment = get_object_or_404(Comment, id=comment_id, user=request.user)
        comment.content = content
        comment.save()
        
        return JsonResponse({
            'success': True,
            'content': comment.content
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== FOLLOW SYSTEM ====================

@login_required
@require_POST
def follow_user(request, user_id):
    """Follow/unfollow a user"""
    try:
        user_to_follow = get_object_or_404(User, id=user_id)
        
        if user_to_follow == request.user:
            return JsonResponse({
                'success': False,
                'error': 'Cannot follow yourself'
            }, status=400)
        
        # Check if already following
        follow_relation = Follow.objects.filter(
            follower=request.user,
            following=user_to_follow
        ).first()
        
        if follow_relation:
            # Unfollow
            follow_relation.delete()
            action = 'unfollowed'
            is_following = False
            # Remove notification
            from .models import Notification
            Notification.objects.filter(
                sender=request.user,
                recipient=user_to_follow,
                notification_type='follow'
            ).delete()
        else:
            # Follow
            Follow.objects.create(
                follower=request.user,
                following=user_to_follow
            )
            action = 'followed'
            is_following = True
            # Create notification
            from .models import Notification
            Notification.objects.get_or_create(
                sender=request.user,
                recipient=user_to_follow,
                notification_type='follow',
                verb=f'started following you'
            )
        
        # Get updated counts
        followers_count = Follow.objects.filter(following=user_to_follow).count()
        following_count = Follow.objects.filter(follower=user_to_follow).count()
        
        return JsonResponse({
            'success': True,
            'action': action,
            'is_following': is_following,
            'followers_count': followers_count,
            'following_count': following_count,
            'user': {
                'id': user_to_follow.id,
                'username': user_to_follow.username,
                'name': user_to_follow.profile.full_name
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_followers(request, username):
    """Get followers list"""
    try:
        user = get_object_or_404(User, username=username)
        followers = User.objects.filter(
            following__following=user
        ).select_related('profile')
        
        followers_data = []
        for follower in followers:
            followers_data.append({
                'id': follower.id,
                'username': follower.username,
                'full_name': follower.profile.full_name,
                'profile_pic': follower.profile.profile_pic.url if follower.profile.profile_pic else None
            })
        
        return JsonResponse({
            'followers': followers_data,
            'total_count': len(followers_data)
        })
    except Exception as e:
        return JsonResponse({
            'followers': [],
            'total_count': 0
        })

@login_required
@require_GET
def get_following(request, username):
    """Get following list"""
    try:
        user = get_object_or_404(User, username=username)
        following = User.objects.filter(
            followers__follower=user
        ).select_related('profile')
        
        following_data = []
        for followed_user in following:
            following_data.append({
                'id': followed_user.id,
                'username': followed_user.username,
                'full_name': followed_user.profile.full_name,
                'profile_pic': followed_user.profile.profile_pic.url if followed_user.profile.profile_pic else None
            })
        
        return JsonResponse({
            'following': following_data,
            'total_count': len(following_data)
        })
    except Exception as e:
        return JsonResponse({
            'following': [],
            'total_count': 0
        })

# ==================== PROFILE MANAGEMENT ====================

@login_required
@require_POST
def update_profile_pic(request):
    """Update profile picture"""
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if 'profile_pic' in request.FILES:
            profile.profile_pic = request.FILES['profile_pic']
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Profile picture updated successfully',
                'new_image_url': profile.profile_pic.url
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No image provided'
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def remove_profile_pic(request):
    """Remove profile picture"""
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if profile.profile_pic:
            profile.profile_pic.delete(save=False)
            profile.profile_pic = None
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Profile picture removed successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No profile picture to remove'
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def update_cover_pic(request):
    """Update cover photo"""
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if 'cover_pic' in request.FILES:
            profile.cover_pic = request.FILES['cover_pic']
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Cover photo updated successfully',
                'new_image_url': profile.cover_pic.url
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No image provided'
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def remove_cover_pic(request):
    """Remove cover photo"""
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if profile.cover_pic:
            profile.cover_pic.delete(save=False)
            profile.cover_pic = None
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Cover photo removed successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No cover photo to remove'
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def update_profile_info(request):
    """Update profile information"""
    try:
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)
        
        data = json.loads(request.body)
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        
        # Update profile fields
        if 'bio' in data:
            profile.bio = data['bio'].strip()
        if 'location' in data:
            profile.location = data['location'].strip()
        if 'website' in data:
            website = data['website'].strip()
            if website and not website.startswith(('http://', 'https://')):
                website = 'https://' + website
            profile.website = website
        
        user.save()
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'data': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'bio': profile.bio,
                'location': profile.location,
                'website': profile.website
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== SEARCH & SUGGESTIONS ====================

@login_required
@require_GET
def search_users(request):
    """Search users for messaging"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return JsonResponse({
                'success': True,
                'users': []
            })
        
        # Search users excluding current user
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(id=request.user.id).select_related('profile')[:10]
        
        users_data = []
        for user in users:
            # Check if already in conversation
            existing_conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=user
            ).filter(is_group=False).first()
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'name': user.profile.full_name,
                'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None,
                'conversation_id': existing_conversation.id if existing_conversation else None
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def suggested_users(request):
    """Get user suggestions"""
    try:
        # Get users that current user follows
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Suggest users not followed by current user
        suggestions = User.objects.exclude(
            Q(id=request.user.id) | Q(id__in=following_users)
        ).order_by('?')[:10]
        
        users_data = []
        for user in suggestions:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'name': user.profile.full_name,
                'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None,
                'posts_count': user.post_set.count()
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== API ENDPOINTS ====================

@login_required
@require_GET
def post_list_api(request):
    """API: Get paginated posts"""
    try:
        page = int(request.GET.get('page', 1))
        posts_per_page = 10
        
        # Get users that current user follows
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Posts from followed users + own posts
        posts = Post.objects.filter(
            Q(author__in=following_users) | Q(author=request.user)
        ).select_related('author', 'author__profile').prefetch_related('likes', 'comments').order_by('-created_at')
        
        # Manual pagination
        total_posts = posts.count()
        total_pages = (total_posts + posts_per_page - 1) // posts_per_page
        start_idx = (page - 1) * posts_per_page
        end_idx = start_idx + posts_per_page
        
        paginated_posts = posts[start_idx:end_idx]
        
        posts_data = []
        for post in paginated_posts:
            posts_data.append({
                'id': post.id,
                'content': post.content,
                'author': {
                    'id': post.author.id,
                    'username': post.author.username,
                    'name': post.author.profile.full_name,
                    'avatar': post.author.profile.profile_pic.url if post.author.profile.profile_pic else None
                },
                'image': post.image.url if post.image else None,
                'video': post.video.url if post.video else None,
                'created_at': post.created_at.strftime('%b %d, %Y %H:%M'),
                'like_count': post.likes.count(),
                'comment_count': post.comments.count(),
                'is_liked': post.likes.filter(user=request.user).exists(),
                'is_owner': post.author == request.user
            })
        
        return JsonResponse({
            'success': True,
            'posts': posts_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'total_posts': total_posts
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def notifications_api(request):
    """API: Get notifications"""
    try:
        from .models import Notification
        
        notifications_qs = Notification.objects.filter(
            recipient=request.user
        ).select_related('sender', 'sender__profile').order_by('-timestamp')[:20]
        
        notifications = []
        for notification in notifications_qs:
            notifications.append({
                'id': notification.id,
                'type': notification.notification_type,
                'actor': {
                    'username': notification.sender.username,
                    'full_name': notification.sender.profile.full_name,
                    'profile_pic': notification.sender.profile.profile_pic.url if notification.sender.profile.profile_pic else None
                },
                'message': notification.verb,
                'created_at': notification.timestamp.strftime('%b %d, %Y %H:%M'),
                'is_read': notification.is_read
            })
        
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        
        return JsonResponse({
            'notifications': notifications,
            'unread_count': unread_count
        })
    except Exception as e:
        return JsonResponse({
            'notifications': [],
            'unread_count': 0
        })

@login_required
@require_GET
def unread_notification_count(request):
    """API: Get unread notification count"""
    try:
        from .models import Notification
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        
        return JsonResponse({
            'unread_count': unread_count
        })
    except Exception as e:
        return JsonResponse({
            'unread_count': 0
        })

@login_required
@require_POST
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    try:
        from .models import Notification
        notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Notification marked as read'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    try:
        from .models import Notification
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        
        return JsonResponse({
            'success': True,
            'message': 'All notifications marked as read'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== UTILITY VIEWS ====================

@login_required
@require_GET
def get_online_users(request):
    """Get list of actual online friends"""
    try:
        # Get users that current user follows (friends)
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Get actual friends who are following back (mutual follows)
        mutual_friends = User.objects.filter(
            id__in=following_users,
            following__follower=request.user
        ).select_related('profile')[:10]
        
        users_data = []
        for user in mutual_friends:
            # Check if user has been active recently (last 30 minutes)
            is_online = user.last_login and (timezone.now() - user.last_login) < timedelta(minutes=30)
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'name': user.profile.full_name,
                'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None,
                'is_online': is_online
            })
        
        # Sort by online status
        users_data.sort(key=lambda x: x['is_online'], reverse=True)
        
        return JsonResponse({
            'success': True,
            'online_users': users_data,
            'count': len([u for u in users_data if u['is_online']])
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_trending_hashtags(request):
    """Get trending hashtags"""
    try:
        # Placeholder implementation
        hashtags = [
            {'name': 'mytro', 'count': 150},
            {'name': 'socialmedia', 'count': 89},
            {'name': 'django', 'count': 67},
            {'name': 'python', 'count': 45},
            {'name': 'webdev', 'count': 32}
        ]
        
        return JsonResponse({
            'success': True,
            'hashtags': hashtags
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def check_profile_completion(request):
    """Check profile completion status"""
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        user = request.user
        
        completion_score = 0
        total_fields = 5
        
        if user.first_name and user.last_name:
            completion_score += 1
        if profile.bio:
            completion_score += 1
        if profile.profile_pic:
            completion_score += 1
        if profile.location:
            completion_score += 1
        if profile.website:
            completion_score += 1
        
        percentage = (completion_score / total_fields) * 100
        
        return JsonResponse({
            'completed': percentage >= 60,
            'percentage': percentage,
            'score': completion_score,
            'total_fields': total_fields
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def check_username_availability(request):
    """Check if username is available"""
    try:
        username = request.GET.get('username', '').strip().lower()
        
        if not username:
            return JsonResponse({
                'available': False,
                'message': 'Username is required'
            })
        
        if len(username) < 3:
            return JsonResponse({
                'available': False,
                'message': 'Username must be at least 3 characters'
            })
        
        # Check if username exists (excluding current user)
        exists = User.objects.filter(username__iexact=username).exclude(id=request.user.id).exists()
        
        if exists:
            return JsonResponse({
                'available': False,
                'message': 'Username is already taken'
            })
        
        return JsonResponse({
            'available': True,
            'message': 'Username is available'
        })
    except Exception as e:
        return JsonResponse({
            'available': False,
            'message': 'Error checking username'
        }, status=500)

@login_required
@require_POST
def repost_post(request, post_id):
    """Repost a post"""
    try:
        original_post = get_object_or_404(Post, id=post_id)
        
        # Check if already reposted
        existing_repost = Post.objects.filter(
            author=request.user,
            repost_parent=original_post
        ).first()
        
        if existing_repost:
            # Undo repost
            existing_repost.delete()
            reposted = False
        else:
            # Create repost
            repost = Post.objects.create(
                author=request.user,
                repost_parent=original_post,
                content=original_post.content,
                image=original_post.image,
                is_public=True
            )
            reposted = True
        
        repost_count = Post.objects.filter(repost_parent=original_post).count()
        
        return JsonResponse({
            'success': True,
            'reposted': reposted,
            'repost_count': repost_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== ADDITIONAL FEATURES ====================

@login_required
@require_GET
def load_more_posts(request):
    """Load more posts for infinite scroll"""
    try:
        offset = int(request.GET.get('offset', 0))
        limit = 10
        
        # Get users that current user follows
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        posts = Post.objects.filter(
            Q(author__in=following_users) | Q(author=request.user)
        ).select_related('author', 'author__profile').prefetch_related('likes', 'comments').order_by('-created_at')[offset:offset + limit]
        
        posts_data = []
        for post in posts:
            posts_data.append({
                'id': post.id,
                'content': post.content,
                'author': {
                    'username': post.author.username,
                    'name': post.author.profile.full_name,
                    'avatar': post.author.profile.profile_pic.url if post.author.profile.profile_pic else None
                },
                'image': post.image.url if post.image else None,
                'like_count': post.likes.count(),
                'comments_count': post.comments.count(),
                'is_liked': post.likes.filter(user=request.user).exists(),
                'created_at': post.created_at.strftime('%b %d, %Y')
            })
        
        return JsonResponse({
            'success': True,
            'posts': posts_data,
            'has_more': len(posts_data) == limit
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def pin_post(request, post_id):
    """Pin/unpin a post"""
    try:
        post = get_object_or_404(Post, id=post_id, author=request.user)
        # Basic implementation
        return JsonResponse({
            'success': True,
            'pinned': True,
            'message': 'Post pinned successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def remove_post_image(request, post_id):
    """Remove image from post"""
    try:
        post = get_object_or_404(Post, id=post_id, author=request.user)
        if post.image:
            post.image.delete(save=False)
            post.image = None
            post.save()
        return JsonResponse({'success': True, 'message': 'Image removed successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_POST
def upload_post_photo(request):
    """Upload post photo"""
    try:
        photo = request.FILES.get('photo')
        post_id = request.POST.get('post_id')
        
        if not photo or not post_id:
            return JsonResponse({'error': 'Photo and post_id required'}, status=400)
        
        post = Post.objects.get(pk=post_id, author=request.user)
        post.image = photo
        post.save()
        return JsonResponse({'photo_url': post.image.url})
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_GET
def get_posts_like_status(request):
    """Get like status for multiple posts"""
    try:
        post_ids = request.GET.get('post_ids', '').split(',')
        post_ids = [pid.strip() for pid in post_ids if pid.strip().isdigit()]
        
        if not post_ids:
            return JsonResponse({'success': True, 'posts': {}})
        
        posts = Post.objects.filter(id__in=post_ids)
        result = {}
        
        for post in posts:
            is_liked = post.likes.filter(user=request.user).exists()
            result[str(post.id)] = {
                'is_liked': is_liked,
                'like_count': post.likes.count()
            }
        
        return JsonResponse({
            'success': True,
            'posts': result
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    


@login_required
@require_POST
def create_group(request):
    """Create a new group conversation"""
    try:
        group_name = request.POST.get('group_name', '').strip()
        description = request.POST.get('description', '').strip()
        members_json = request.POST.get('members', '[]')
        
        if not group_name:
            return JsonResponse({'success': False, 'error': 'Group name is required'}, status=400)
        
        # Parse member IDs
        try:
            member_ids = json.loads(members_json)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid members data'}, status=400)
        
        if len(member_ids) < 1:
            return JsonResponse({'success': False, 'error': 'Add at least one member'}, status=400)
        
        # Create group conversation
        conversation = Conversation.objects.create(
            is_group=True,
            group_name=group_name
        )
        
        # Add creator and members
        conversation.participants.add(request.user)
        for member_id in member_ids:
            try:
                user = User.objects.get(id=member_id)
                conversation.participants.add(user)
            except User.DoesNotExist:
                continue
        
        # Handle group photo
        if 'group_photo' in request.FILES:
            conversation.group_photo = request.FILES['group_photo']
            conversation.save()
        
        return JsonResponse({
            'success': True,
            'conversation_id': conversation.id,
            'message': 'Group created successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_GET
def get_unread_message_count(request):
    """Get unread message count for notifications - FIXED"""
    try:
        from .models import ConversationMessage
        
        # Total unread messages count from Conversation system
        total_unread = ConversationMessage.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        
        # Unique senders with unread messages
        unique_senders = ConversationMessage.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).values('sender').distinct().count()
        
        print(f"📊 Unread counts - Total: {total_unread}, Senders: {unique_senders}")
        
        return JsonResponse({
            'success': True,
            'total_unread': total_unread,
            'unique_senders': unique_senders
        })
        
    except Exception as e:
        print(f"❌ Error in get_unread_message_count: {e}")
        return JsonResponse({
            'success': False, 
            'total_unread': 0, 
            'unique_senders': 0,
            'error': str(e)
        })

@login_required
@require_POST
def mark_conversation_read(request, conversation_id):
    """Mark all messages in conversation as read - FIXED"""
    try:
        from .models import ConversationMessage
        
        # Mark all messages in conversation as read
        updated_count = ConversationMessage.objects.filter(
            conversation_id=conversation_id,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)
        
        print(f"✅ Marked {updated_count} messages as read in conversation {conversation_id}")
        
        return JsonResponse({'success': True, 'updated_count': updated_count})
        
    except Exception as e:
        print(f"❌ Error in mark_conversation_read: {e}")
        return JsonResponse({'success': False, 'error': str(e)})

# ==================== LEGACY COMPATIBILITY ====================

@login_required
def follow_user_legacy(request, username):
    """Legacy follow function"""
    user_to_follow = get_object_or_404(User, username=username)
    return follow_user(request, user_to_follow.id)

@login_required  
def unfollow_user_legacy(request, username):
    """Legacy unfollow function"""
    user_to_unfollow = get_object_or_404(User, username=username)
    return follow_user(request, user_to_unfollow.id)

@login_required
def update_profile_info_form(request):
    """Legacy form-based profile update"""
    try:
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)
        
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.save()
        
        profile.bio = request.POST.get('bio', profile.bio)
        profile.location = request.POST.get('location', profile.location)
        profile.website = request.POST.get('website', profile.website)
        profile.save()
        
        return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    

@login_required
@require_POST
def like_comment(request, comment_id):
    """Like/unlike a comment"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        # For now, return success response
        return JsonResponse({
            'success': True,
            'liked': True,
            'like_count': 1,
            'message': 'Comment liked successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def reply_comment(request, comment_id):
    """Reply to a comment"""
    try:
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        
        if not content:
            return JsonResponse({
                'success': False,
                'error': 'Reply content cannot be empty'
            }, status=400)
        
        parent_comment = get_object_or_404(Comment, id=comment_id)
        
        reply = Comment.objects.create(
            user=request.user,
            post=parent_comment.post,
            content=content,
            parent=parent_comment
        )
        
        return JsonResponse({
            'success': True,
            'reply': {
                'id': reply.id,
                'content': reply.content,
                'user': {
                    'username': reply.user.username,
                    'name': reply.user.profile.full_name,
                    'avatar': reply.user.profile.profile_pic.url if reply.user.profile.profile_pic else None
                },
                'created_at': reply.created_at.strftime('%b %d, %Y %H:%M'),
                'is_owner': True
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
@require_POST
def save_post(request, post_id):
    """Save/unsave post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        # Placeholder implementation - you'll need a SavedPost model
        return JsonResponse({
            'success': True,
            'saved': True,
            'action': 'saved',
            'message': 'Post saved successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def report_content(request):
    """Report content"""
    try:
        data = json.loads(request.body)
        content_type = data.get('type')
        content_id = data.get('id')
        reason = data.get('reason', '').strip()
        
        if not content_type or not content_id or not reason:
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields'
            }, status=400)
        
        # Create report (you'll need a Report model)
        return JsonResponse({
            'success': True,
            'message': 'Thank you for your report. We will review it shortly.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== DEBUG/UTILITY FUNCTIONS ====================

def url_test(request):
    """Debug URL test"""
    from django.urls import reverse
    urls = {
        'update_cover_pic': reverse('update_cover_pic'),
        'update_profile_pic': reverse('update_profile_pic'),
        'edit_profile': reverse('edit_profile'),
    }
    return JsonResponse(urls)

def debug_urls(request):
    """Debug all URLs"""
    from django.urls import reverse, NoReverseMatch
    urls_to_check = [
        'update_profile_pic', 'update_cover_pic', 'remove_profile_pic',
        'remove_cover_pic', 'edit_profile', 'feed', 'post_create'
    ]
    
    results = {}
    for url_name in urls_to_check:
        try:
            results[url_name] = reverse(url_name)
        except NoReverseMatch:
            results[url_name] = "NOT FOUND"
    
    return JsonResponse(results)

# ==================== MESSAGING SYSTEM ====================

@login_required
@require_GET
def messages_view(request):
    """Main messages page"""
    conversations = request.user.conversations.all().order_by('-updated_at')
    return render(request, 'core/messages.html', {'conversations': conversations})

@login_required
@require_GET
def get_conversations(request):
    """Get user's conversations with proper unread count - FIXED"""
    try:
        from .models import Conversation, ConversationMessage
        
        conversations = request.user.conversations.all().order_by('-updated_at')
        
        conversations_data = []
        for conv in conversations:
            if conv.is_group:
                # Group conversation
                name = conv.group_name or "Group Chat"
                avatar = conv.group_photo.url if conv.group_photo else None
                other_user_id = None
            else:
                # One-on-one conversation
                other_user = conv.get_other_participant(request.user)
                if other_user:
                    name = other_user.profile.full_name if hasattr(other_user, 'profile') else other_user.username
                    avatar = other_user.profile.profile_pic.url if other_user.profile and other_user.profile.profile_pic else None
                    other_user_id = other_user.id
                else:
                    name = "Unknown User"
                    avatar = None
                    other_user_id = None
            
            last_message = conv.messages.last()
            
            # Calculate unread count - FIXED
            unread_count = conv.messages.filter(is_read=False).exclude(sender=request.user).count()
            
            conversations_data.append({
                'id': conv.id,
                'is_group': conv.is_group,
                'name': name,
                'avatar': avatar,
                'other_user_id': other_user_id,
                'last_message': {
                    'content': last_message.content if last_message else 'No messages yet',
                    'timestamp': last_message.timestamp.strftime('%H:%M') if last_message else '',
                    'sender': last_message.sender.username if last_message else '',
                    'unread': unread_count,
                    'is_own': last_message.sender == request.user if last_message else False
                } if last_message else {
                    'content': 'No messages yet',
                    'timestamp': '',
                    'sender': '',
                    'unread': 0,
                    'is_own': False
                },
                'unread_count': unread_count,
                'online': False  # You can implement online status later
            })
        
        print(f"💬 Loaded {len(conversations_data)} conversations")
        return JsonResponse({
            'success': True,
            'conversations': conversations_data
        })
        
    except Exception as e:
        print(f"❌ Error in get_conversations: {e}")
        return JsonResponse({
            'success': False, 
            'conversations': [],
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def send_message(request):
    """Send a message - FIXED"""
    try:
        from .models import Conversation, ConversationMessage
        
        data = json.loads(request.body)
        
        recipient_id = data.get('recipient_id')
        content = data.get('content', '').strip()
        
        if not recipient_id or not content:
            return JsonResponse({'success': False, 'error': 'Missing required fields'}, status=400)
        
        recipient = get_object_or_404(User, id=recipient_id)
        
        # Get or create conversation - FIXED
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).filter(is_group=False).first()
        
        if not conversation:
            conversation = Conversation.objects.create(is_group=False)
            conversation.participants.add(request.user, recipient)
            print(f"✅ Created new conversation {conversation.id}")
        
        # Create message - FIXED
        message = ConversationMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        conversation.updated_at = timezone.now()
        conversation.save()
        
        print(f"✅ Sent message in conversation {conversation.id}")
        
        return JsonResponse({
            'success': True,
            'conversation_id': conversation.id,
            'message': {
                'id': message.id,
                'content': message.content,
                'sender': {
                    'id': message.sender.id,
                    'name': message.sender.profile.full_name if hasattr(message.sender, 'profile') else message.sender.username,
                    'avatar': message.sender.profile.profile_pic.url if message.sender.profile and message.sender.profile.profile_pic else None
                },
                'timestamp': message.timestamp.strftime('%H:%M'),
                'is_read': message.is_read,
                'is_own': True
            }
        })
        
    except Exception as e:
        print(f"❌ Error in send_message: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_POST
def start_conversation(request):
    """Start a new conversation with a user"""
    try:
        from .models import Conversation
        data = json.loads(request.body)
        
        recipient_id = data.get('recipient_id')
        if not recipient_id:
            return JsonResponse({'success': False, 'error': 'Recipient ID required'}, status=400)
        
        recipient = get_object_or_404(User, id=recipient_id)
        
        # Check if conversation already exists
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).filter(is_group=False).first()
        
        if not conversation:
            conversation = Conversation.objects.create(is_group=False)
            conversation.participants.add(request.user, recipient)
        
        return JsonResponse({
            'success': True,
            'conversation_id': conversation.id,
            'recipient': {
                'id': recipient.id,
                'name': recipient.profile.full_name,
                'username': recipient.username,
                'avatar': recipient.profile.profile_pic.url if recipient.profile.profile_pic else None
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_GET
def get_messages(request, conversation_id):
    """Get messages for a conversation - FIXED"""
    try:
        from .models import Conversation, ConversationMessage
        
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        messages = conversation.messages.all().order_by('timestamp')
        
        messages_data = []
        for message in messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'sender': {
                    'id': message.sender.id,
                    'name': message.sender.profile.full_name if hasattr(message.sender, 'profile') else message.sender.username,
                    'avatar': message.sender.profile.profile_pic.url if message.sender.profile and message.sender.profile.profile_pic else None
                },
                'timestamp': message.timestamp.strftime('%H:%M'),
                'is_read': message.is_read,
                'is_own': message.sender == request.user,
                'type': 'text'  # Default type
            })
        
        # Mark messages as read - FIXED
        unread_messages = conversation.messages.filter(is_read=False).exclude(sender=request.user)
        updated_count = unread_messages.update(is_read=True)
        print(f"📖 Marked {updated_count} messages as read in conversation {conversation_id}")
        
        return JsonResponse({
            'success': True,
            'messages': messages_data,
            'conversation_id': conversation_id
        })
        
    except Exception as e:
        print(f"❌ Error in get_messages: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_POST
def create_story(request):
    """Create a new story"""
    try:
        from .models import Story
        
        story_type = request.POST.get('story_type', 'text')
        text_content = request.POST.get('story_text', '')
        
        story = Story.objects.create(
            user=request.user,
            story_type=story_type,
            text_content=text_content
        )
        
        if 'story_image' in request.FILES:
            story.image = request.FILES['story_image']
            story.save()
        
        return JsonResponse({
            'success': True,
            'story_id': story.id,
            'message': 'Story created successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_GET
def get_stories(request):
    """Get all active stories grouped by user"""
    try:
        from .models import Story
        from django.db.models import Count
        
        # Get non-expired stories from followed users and self
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Get users who have active stories
        users_with_stories = User.objects.filter(
            Q(id__in=following_users) | Q(id=request.user.id),
            stories__expires_at__gt=timezone.now()
        ).distinct().select_related('profile')
        
        stories_data = []
        for user in users_with_stories:
            user_stories = Story.objects.filter(
                user=user,
                expires_at__gt=timezone.now()
            ).order_by('-created_at')
            
            if user_stories.exists():
                stories_data.append({
                    'user': {
                        'id': user.id,
                        'name': user.profile.full_name,
                        'username': user.username,
                        'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None
                    },
                    'story_count': user_stories.count(),
                    'latest_story': {
                        'id': user_stories.first().id,
                        'created_at': user_stories.first().created_at.strftime('%H:%M')
                    },
                    'is_viewed': False  # TODO: Implement story views
                })
        
        return JsonResponse({
            'success': True,
            'stories': stories_data
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_GET
def get_story_detail(request, story_id):
    """Get story details"""
    try:
        from .models import Story
        
        story = get_object_or_404(Story, id=story_id, expires_at__gt=timezone.now())
        
        # Check if user can view this story (following or own)
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        if story.user != request.user and story.user.id not in following_users:
            return JsonResponse({'success': False, 'error': 'Not authorized'}, status=403)
        
        story_data = {
            'id': story.id,
            'story_type': story.story_type,
            'text_content': story.text_content,
            'image': story.image.url if story.image else None,
            'background_color': story.background_color,
            'user': {
                'id': story.user.id,
                'name': story.user.profile.full_name,
                'username': story.user.username,
                'avatar': story.user.profile.profile_pic.url if story.user.profile.profile_pic else None
            },
            'created_at': story.created_at.strftime('%H:%M')
        }
        
        return JsonResponse(story_data)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_GET
def get_user_stories(request, user_id):
    """Get all stories for a specific user"""
    try:
        from .models import Story
        
        user = get_object_or_404(User, id=user_id)
        
        # Check if user can view stories (following or own)
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        if user != request.user and user.id not in following_users:
            return JsonResponse({'success': False, 'error': 'Not authorized'}, status=403)
        
        stories = Story.objects.filter(
            user=user,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        stories_data = []
        for story in stories:
            stories_data.append({
                'id': story.id,
                'story_type': story.story_type,
                'text_content': story.text_content,
                'image': story.image.url if story.image else None,
                'background_color': story.background_color,
                'user': {
                    'id': story.user.id,
                    'name': story.user.profile.full_name,
                    'username': story.user.username,
                    'avatar': story.user.profile.profile_pic.url if story.user.profile.profile_pic else None
                },
                'created_at': story.created_at.strftime('%H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'stories': stories_data
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_POST
def vote_poll(request, post_id):
    """Vote on a poll"""
    try:
        from .models import PollVote
        data = json.loads(request.body)
        option_index = data.get('option_index')
        
        if option_index is None:
            return JsonResponse({'success': False, 'error': 'Option index required'}, status=400)
        
        post = get_object_or_404(Post, id=post_id, post_type='poll')
        
        # Check if user already voted
        existing_vote = PollVote.objects.filter(user=request.user, post=post).first()
        
        if existing_vote and not post.poll_multiple_choice:
            return JsonResponse({'success': False, 'error': 'You have already voted'}, status=400)
        
        # Create vote
        vote, created = PollVote.objects.get_or_create(
            user=request.user,
            post=post,
            option_index=option_index
        )
        
        # Get poll results
        poll_results = []
        for i, option in enumerate(post.poll_options):
            vote_count = PollVote.objects.filter(post=post, option_index=i).count()
            poll_results.append({
                'option': option,
                'votes': vote_count
            })
        
        return JsonResponse({
            'success': True,
            'poll_results': poll_results,
            'user_voted': True
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

# ==================== ERROR HANDLING ====================

def handler404(request, exception):
    """Custom 404 handler"""
    return render(request, 'core/404.html', status=404)

def handler500(request):
    """Custom 500 handler"""
    return render(request, 'core/500.html', status=500)

@login_required
def edit_profile_modern_view(request):
    """Modern edit profile view"""
    if request.method == 'POST':
        return edit_profile_view(request)  # Use existing logic
    
    # Ensure profile exists
    profile, created = Profile.objects.get_or_create(user=request.user)
    return render(request, 'core/edit_profile_modern_v2.html', {
        'user': request.user,
        'profile': profile
    })

@login_required
@require_POST
def delete_story(request, story_id):
    """Delete a story"""
    try:
        from .models import Story
        
        story = get_object_or_404(Story, id=story_id, user=request.user)
        story.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Story deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_GET
def get_user_posts(request, user_id):
    """Get paginated posts from a specific user"""
    try:
        user = get_object_or_404(User, id=user_id)
        page = int(request.GET.get('page', 1))
        exclude_id = request.GET.get('exclude')
        posts_per_page = 5
        
        posts_query = Post.objects.filter(author=user).select_related('author', 'author__profile').prefetch_related('likes', 'comments').order_by('-created_at')
        
        if exclude_id:
            posts_query = posts_query.exclude(id=exclude_id)
        
        total_posts = posts_query.count()
        total_pages = (total_posts + posts_per_page - 1) // posts_per_page
        start_idx = (page - 1) * posts_per_page
        end_idx = start_idx + posts_per_page
        
        posts = posts_query[start_idx:end_idx]
        
        posts_data = []
        for post in posts:
            posts_data.append({
                'id': post.id,
                'content': post.content,
                'author': {
                    'id': post.author.id,
                    'username': post.author.username,
                    'name': post.author.profile.full_name or post.author.username,
                    'avatar': post.author.profile.profile_pic.url if post.author.profile.profile_pic else None
                },
                'image': post.image.url if post.image else None,
                'created_at': post.created_at.strftime('%b %d, %Y'),
                'like_count': post.likes.count(),
                'comment_count': post.comments.count(),
                'is_liked': post.likes.filter(user=request.user).exists()
            })
        
        return JsonResponse({
            'success': True,
            'posts': posts_data,
            'has_next': page < total_pages,
            'current_page': page,
            'total_pages': total_pages
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== ADMIN PANEL ====================

@staff_member_required
def admin_panel(request):
    """Admin panel main view"""
    users = User.objects.all().select_related('profile').order_by('-date_joined')[:50]
    posts = Post.objects.all().select_related('author', 'author__profile').order_by('-created_at')[:20]
    
    # Statistics
    total_users = User.objects.count()
    total_posts = Post.objects.count()
    active_users = User.objects.filter(last_login__gte=timezone.now() - timedelta(days=1)).count()
    
    context = {
        'users': users,
        'posts': posts,
        'total_users': total_users,
        'total_posts': total_posts,
        'active_users': active_users,
    }
    
    return render(request, 'core/admin_panel.html', context)

@staff_member_required
@require_GET
def admin_get_user(request, user_id):
    """Get user details for editing"""
    try:
        user = get_object_or_404(User, id=user_id)
        profile, created = Profile.objects.get_or_create(user=user)
        
        return JsonResponse({
            'success': True,
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name or '',
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined.strftime('%Y-%m-%d'),
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_update_user(request, user_id):
    """Update user details"""
    try:
        user = get_object_or_404(User, id=user_id)
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Update user fields
        user.username = request.POST.get('username', user.username)
        user.email = request.POST.get('email', user.email)
        user.is_active = request.POST.get('is_active') == 'true'
        user.is_staff = request.POST.get('is_staff') == 'true'
        
        # Update profile
        full_name = request.POST.get('full_name', '')
        if full_name:
            names = full_name.split(' ', 1)
            user.first_name = names[0]
            user.last_name = names[1] if len(names) > 1 else ''
        
        user.save()
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'User updated successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_toggle_user_status(request, user_id):
    """Activate/deactivate user"""
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        user.is_active = data.get('is_active', True)
        user.save()
        
        action = 'activated' if user.is_active else 'suspended'
        return JsonResponse({
            'success': True,
            'message': f'User {action} successfully',
            'is_active': user.is_active
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_delete_user(request, user_id):
    """Delete user account"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Don't allow deleting superusers or self
        if user.is_superuser or user == request.user:
            return JsonResponse({
                'success': False,
                'error': 'Cannot delete this user'
            }, status=400)
        
        username = user.username
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'User {username} deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_change_password(request, user_id):
    """Change user password"""
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        new_password = data.get('new_password')
        if not new_password or len(new_password) < 6:
            return JsonResponse({
                'success': False,
                'error': 'Password must be at least 6 characters'
            }, status=400)
        
        user.set_password(new_password)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_delete_post(request, post_id):
    """Delete post from admin panel"""
    try:
        post = get_object_or_404(Post, id=post_id)
        author_name = post.author.username
        post.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Post by {author_name} deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

# ==================== ADMIN API ENDPOINTS ====================

@staff_member_required
@require_POST
def admin_api_user_toggle(request, user_id):
    """API: Toggle user active status"""
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        user.is_active = data.get('is_active', True)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'User {"activated" if user.is_active else "suspended"} successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_api_user_delete(request, user_id):
    """API: Delete user"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        if user.is_superuser or user == request.user:
            return JsonResponse({
                'success': False,
                'message': 'Cannot delete this user'
            }, status=400)
        
        user.delete()
        return JsonResponse({
            'success': True,
            'message': 'User deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_api_user_update(request, user_id):
    """API: Update user"""
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.is_active = data.get('is_active', user.is_active)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'User updated successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_api_user_password(request, user_id):
    """API: Change user password"""
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        new_password = data.get('new_password')
        if len(new_password) < 6:
            return JsonResponse({
                'success': False,
                'message': 'Password must be at least 6 characters'
            }, status=400)
        
        user.set_password(new_password)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@staff_member_required
@require_POST
def admin_api_post_delete(request, post_id):
    """API: Delete post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        post.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Post deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

@login_required
def profile_by_id_view(request, user_id):
    """View profile by user ID"""
    user = get_object_or_404(User, id=user_id)
    return profile_view(request, username=user.username)

def admin_send_notification(request):
    """Send notification to user(s)"""
    if not request.user.is_staff:
        return JsonResponse({'success': False, 'message': 'Not authorized'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST required'}, status=405)
    
    try:
        from .models import Notification
        data = json.loads(request.body)
        
        user_ids = data.get('user_ids', [])
        message = data.get('message', '').strip()
        
        if not message:
            return JsonResponse({'success': False, 'message': 'Message is required'}, status=400)
        
        if not user_ids:
            return JsonResponse({'success': False, 'message': 'Select at least one user'}, status=400)
        
        # Send to all users or specific users
        if 'all' in user_ids:
            users = User.objects.filter(is_active=True).exclude(id=request.user.id)
        else:
            users = User.objects.filter(id__in=user_ids, is_active=True).exclude(id=request.user.id)
        
        notifications_created = 0
        for user in users:
            Notification.objects.create(
                sender=request.user,
                recipient=user,
                notification_type='mention',
                verb=f'Admin: {message}'
            )
            notifications_created += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Notification sent to {notifications_created} users'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

def admin_send_message(request):
    """Send message to user(s)"""
    if not request.user.is_staff:
        return JsonResponse({'success': False, 'message': 'Not authorized'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST required'}, status=405)
    
    try:
        from .models import Message
        data = json.loads(request.body)
        
        user_ids = data.get('user_ids', [])
        message_content = data.get('message', '').strip()
        
        if not message_content:
            return JsonResponse({'success': False, 'message': 'Message is required'}, status=400)
        
        if not user_ids:
            return JsonResponse({'success': False, 'message': 'Select at least one user'}, status=400)
        
        # Send to all users or specific users
        if 'all' in user_ids:
            users = User.objects.filter(is_active=True).exclude(id=request.user.id)
        else:
            users = User.objects.filter(id__in=user_ids, is_active=True).exclude(id=request.user.id)
        
        messages_sent = 0
        for user in users:
            Message.objects.create(
                sender=request.user,
                recipient=user,
                content=f'Admin Message: {message_content}'
            )
            messages_sent += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Message sent to {messages_sent} users'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

# Test endpoints
def test_admin_notification(request):
    return JsonResponse({
        'success': True, 
        'message': 'Test notification endpoint working', 
        'method': request.method, 
        'user': str(request.user),
        'is_staff': request.user.is_staff if request.user.is_authenticated else False
    })

def test_admin_message(request):
    return JsonResponse({
        'success': True, 
        'message': 'Test message endpoint working', 
        'method': request.method, 
        'user': str(request.user),
        'is_staff': request.user.is_staff if request.user.is_authenticated else False
    })

def admin_debug_urls(request):
    """Debug endpoint to check URL routing"""
    from django.urls import reverse
    try:
        urls = {
            'test_notification': reverse('test_admin_notification'),
            'test_message': reverse('test_admin_message'),
            'send_notification': reverse('admin_send_notification'),
            'send_message': reverse('admin_send_message'),
        }
        return JsonResponse({'success': True, 'urls': urls})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
# ==================== ENHANCED MESSAGING APIs ====================

@login_required
@require_GET
def search_users_for_chat(request):
    """Search users for new chat - ENHANCED"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return JsonResponse({
                'success': True,
                'users': []
            })
        
        # Get users that current user follows or who follow current user
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        followers = Follow.objects.filter(following=request.user).values_list('follower', flat=True)
        
        # Combine both lists for search
        connected_users = set(following_users) | set(followers)
        
        # Search in connected users first
        users = User.objects.filter(
            Q(id__in=connected_users) &
            (Q(username__icontains=query) |
             Q(first_name__icontains=query) |
             Q(last_name__icontains=query) |
             Q(profile__full_name__icontains=query))
        ).exclude(id=request.user.id).select_related('profile')[:20]
        
        users_data = []
        for user in users:
            # Check if conversation already exists
            existing_conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=user
            ).filter(is_group=False).first()
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'name': user.profile.full_name or user.username,
                'avatar': user.profile.profile_pic.url if user.profile.profile_pic else None,
                'is_online': user.last_login and (timezone.now() - user.last_login) < timedelta(minutes=5),
                'conversation_id': existing_conversation.id if existing_conversation else None,
                'is_following': Follow.objects.filter(follower=request.user, following=user).exists(),
                'is_follower': Follow.objects.filter(follower=user, following=request.user).exists()
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data
        })
        
    except Exception as e:
        print(f"Error searching users: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def delete_message(request, message_id):
    """Delete a message"""
    try:
        message = get_object_or_404(ConversationMessage, id=message_id, sender=request.user)
        conversation_id = message.conversation.id
        message.delete()
        
        # Get updated last message
        conversation = Conversation.objects.get(id=conversation_id)
        last_message = conversation.messages.last()
        
        return JsonResponse({
            'success': True,
            'message': 'Message deleted successfully',
            'conversation_id': conversation_id,
            'last_message': {
                'content': last_message.content if last_message else '',
                'timestamp': last_message.timestamp.strftime('%H:%M') if last_message else '',
                'sender': last_message.sender.username if last_message else ''
            } if last_message else None
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def delete_conversation(request, conversation_id):
    """Delete entire conversation"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        
        # Delete all messages in conversation
        conversation.messages.all().delete()
        conversation.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Conversation deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def clear_conversation(request, conversation_id):
    """Clear all messages but keep conversation"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        
        # Delete all messages
        deleted_count = conversation.messages.all().delete()[0]
        
        return JsonResponse({
            'success': True,
            'message': f'Cleared {deleted_count} messages',
            'deleted_count': deleted_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def mark_message_unread(request, message_id):
    """Mark message as unread"""
    try:
        message = get_object_or_404(ConversationMessage, id=message_id)
        # Only mark as unread if you're the recipient
        if request.user in message.conversation.participants.all() and message.sender != request.user:
            message.is_read = False
            message.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Message marked as unread'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Cannot mark this message as unread'
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET  
def search_messages(request, conversation_id):
    """Search messages within a conversation"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query:
            return JsonResponse({
                'success': True,
                'messages': []
            })
        
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        
        # Search messages containing query
        messages = conversation.messages.filter(
            content__icontains=query
        ).order_by('-timestamp')[:50]
        
        messages_data = []
        for message in messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'timestamp': message.timestamp.strftime('%b %d, %Y %H:%M'),
                'sender': {
                    'name': message.sender.profile.full_name or message.sender.username,
                    'avatar': message.sender.profile.profile_pic.url if message.sender.profile.profile_pic else None
                },
                'is_own': message.sender == request.user
            })
        
        return JsonResponse({
            'success': True,
            'query': query,
            'results': messages_data,
            'count': len(messages_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def start_typing(request):
    """Start typing indicator"""
    try:
        data = json.loads(request.body)
        conversation_id = data.get('conversation_id')
        
        # Here you would typically use WebSockets
        # For now, we'll just return success
        return JsonResponse({
            'success': True,
            'typing': True
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def stop_typing(request):
    """Stop typing indicator"""
    try:
        data = json.loads(request.body)
        conversation_id = data.get('conversation_id')
        
        return JsonResponse({
            'success': True,
            'typing': False
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_GET
def get_online_status(request, user_id):
    """Get user online status"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        is_online = user.last_login and (timezone.now() - user.last_login) < timedelta(minutes=5)
        last_seen = user.last_login.strftime('%H:%M') if user.last_login else 'Never'
        
        return JsonResponse({
            'success': True,
            'is_online': is_online,
            'last_seen': last_seen
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)