from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import Post, Comment, SavedPost
import json


class PostAjaxTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='alice', password='pass')
        self.other = User.objects.create_user(username='bob', password='pass')
        self.post = Post.objects.create(author=self.other, content='Hello world')

    def test_like_unlike_post(self):
        # unauthenticated should be redirected / 403 depending on middleware
        res = self.client.post(f'/api/posts/{self.post.id}/like/')
        self.assertIn(res.status_code, (302, 401, 403))

        # login and like
        self.client.force_login(self.user)
        res = self.client.post(f'/api/posts/{self.post.id}/like/', content_type='application/json')
        data = json.loads(res.content)
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('liked'))

        # unlike
        res2 = self.client.post(f'/api/posts/{self.post.id}/like/', content_type='application/json')
        data2 = json.loads(res2.content)
        self.assertTrue(data2.get('success'))
        self.assertFalse(data2.get('liked'))

    def test_add_comment(self):
        self.client.force_login(self.user)
        payload = {'post_id': self.post.id, 'comment': 'Nice post!'}
        res = self.client.post('/api/comments/add/', data=json.dumps(payload), content_type='application/json')
        data = json.loads(res.content)
        self.assertTrue(data.get('success'))
        comment = data.get('comment')
        self.assertEqual(comment.get('content'), 'Nice post!')
        self.assertEqual(comment.get('user').get('username'), self.user.username)

    def test_save_unsave_post(self):
        self.client.force_login(self.user)
        res = self.client.post(f'/api/posts/{self.post.id}/save/')
        data = json.loads(res.content)
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('saved'))
        self.assertEqual(SavedPost.objects.filter(user=self.user, post=self.post).count(), 1)

        # unsave
        res2 = self.client.post(f'/api/posts/{self.post.id}/save/')
        data2 = json.loads(res2.content)
        self.assertTrue(data2.get('success'))
        self.assertFalse(data2.get('saved'))
        self.assertEqual(SavedPost.objects.filter(user=self.user, post=self.post).count(), 0)
